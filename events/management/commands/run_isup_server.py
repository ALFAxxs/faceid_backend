"""
ISUP5.0 TCP server — to'liq registration handshake bilan.
"""
import asyncio
import json
import logging
import struct
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

ISUP_PORT = 7332

# ISUP5.0 message types
MSG_REG       = 0x01  # Registration request (qurilmadan)
MSG_REG_ACK   = 0x02  # Registration response (serverdan)
MSG_KEEPALIVE = 0x03  # Heartbeat (qurilmadan)
MSG_KA_ACK    = 0x04  # Heartbeat response (serverdan)
MSG_ALARM     = 0x06  # Event/alarm (qurilmadan)
MSG_ALARM_ACK = 0x07  # Event response (serverdan)
MSG_TRANS     = 0x09  # Transparent data


def build_isup_response(msg_type: int, device_id: str = '', seq: int = 0, result: int = 0) -> bytes:
    """
    ISUP5.0 response paketi yaratadi.
    Header format (32 bytes):
      [0:4]  magic = 'ISUP'
      [4]    version = 5
      [5]    msg_type
      [6:8]  reserved
      [8:12] seq number
      [12:16] session_id
      [16:20] payload_length
      [20:24] result_code
      [24:32] reserved
    """
    magic = b'ISUP'
    version = 5
    reserved = 0
    session_id = 0
    
    # Payload: JSON
    if msg_type == MSG_REG_ACK:
        payload = json.dumps({
            'result': result,
            'sessionId': session_id,
            'deviceID': device_id,
        }).encode('utf-8')
    elif msg_type == MSG_KA_ACK:
        payload = json.dumps({'result': 0}).encode('utf-8')
    elif msg_type == MSG_ALARM_ACK:
        payload = json.dumps({'result': 0}).encode('utf-8')
    else:
        payload = b''

    payload_len = len(payload)

    header = struct.pack(
        '>4sBBHIIII',
        magic,
        version,
        msg_type,
        reserved,
        seq,
        session_id,
        payload_len,
        result,
    )
    # Header 32 bytes bo'lishi uchun padding
    header = header + b'\x00' * (32 - len(header))
    return header + payload


def parse_isup_packet(data: bytes) -> dict | None:
    """ISUP5.0 paketini parse qiladi."""
    try:
        if len(data) < 32:
            # Qisqa paket — JSON bo'lishi mumkin
            try:
                return {'_raw': True, 'json': json.loads(data.decode('utf-8', errors='ignore'))}
            except Exception:
                return None

        magic = data[:4]
        
        if magic == b'ISUP':
            version  = data[4]
            msg_type = data[5]
            seq      = struct.unpack('>I', data[8:12])[0]
            pay_len  = struct.unpack('>I', data[16:20])[0]
            payload  = data[32:32 + pay_len] if pay_len > 0 else b''

            result = {
                '_isup': True,
                '_msg_type': msg_type,
                '_seq': seq,
                '_version': version,
            }

            if payload:
                try:
                    result.update(json.loads(payload.decode('utf-8')))
                except Exception:
                    result['_raw_payload'] = payload.hex()

            return result

        # ISUP magic yo'q — JSON tekshiramiz
        try:
            return {'_raw': True, 'json': json.loads(data.decode('utf-8', errors='ignore'))}
        except Exception:
            logger.debug(f"Noma'lum paket: {data[:64].hex()}")
            return None

    except Exception as e:
        logger.error(f"Parse xatosi: {e}")
        return None


from events.services import save_access_event, event_payload


@sync_to_async
def save_event(device_id: str, event_data: dict):
    try:
        return save_access_event(device_id, event_data)
    except Exception as e:
        logger.error(f"Event saqlash xatosi: {e}")
        return None


async def handle_device(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    addr = writer.get_extra_info('peername')
    device_id = str(addr[0])
    channel_layer = get_channel_layer()

    logger.info(f"Yangi ulanish: {addr}")

    try:
        while True:
            # Avval 32 bayt header o'qiymiz
            try:
                header_data = await asyncio.wait_for(reader.readexactly(32), timeout=90.0)
            except asyncio.IncompleteReadError:
                break

            # Payload uzunligini aniqlaymiz
            pay_len = 0
            if header_data[:4] == b'ISUP':
                pay_len = struct.unpack('>I', header_data[16:20])[0]

            payload_data = b''
            if pay_len > 0:
                try:
                    payload_data = await asyncio.wait_for(
                        reader.readexactly(min(pay_len, 65536)), timeout=10.0
                    )
                except asyncio.IncompleteReadError:
                    break

            data = header_data + payload_data
            parsed = parse_isup_packet(data)

            if parsed is None:
                continue

            msg_type = parsed.get('_msg_type', -1)
            seq      = parsed.get('_seq', 0)

            # --- Registration ---
            if msg_type == MSG_REG:
                device_id = parsed.get('deviceID') or parsed.get('deviceId') or device_id
                logger.info(f"REG: {device_id} ({addr})")
                ack = build_isup_response(MSG_REG_ACK, device_id=device_id, seq=seq, result=0)
                writer.write(ack)
                await writer.drain()
                logger.info(f"REG_ACK yuborildi → {device_id}")

            # --- Keepalive ---
            elif msg_type == MSG_KEEPALIVE:
                ack = build_isup_response(MSG_KA_ACK, seq=seq)
                writer.write(ack)
                await writer.drain()

            # --- Alarm / Event ---
            elif msg_type in (MSG_ALARM, MSG_TRANS):
                logger.info(f"EVENT [{device_id}]: {parsed}")
                ack = build_isup_response(MSG_ALARM_ACK, seq=seq)
                writer.write(ack)
                await writer.drain()

                event_keys = {'employeeNo', 'cardNo', 'type', 'eventType'}
                if not event_keys.isdisjoint(parsed.keys()):
                    event = await save_event(device_id, parsed)
                    if event and channel_layer:
                        await channel_layer.group_send(
                            'events_live',
                            {'type': 'event.new', 'data': event_payload(event, device_id)},
                        )
                        logger.info(f"Event saqlandi: {event}")

            # --- Noma'lum ---
            else:
                logger.warning(f"Noma'lum msg_type={msg_type} [{device_id}]: {parsed}")
                # Baribir ACK yuboramiz
                writer.write(b'\x00' * 32)
                await writer.drain()

    except asyncio.TimeoutError:
        logger.info(f"Timeout: {addr}")
    except ConnectionResetError:
        logger.info(f"Uzildi: {addr}")
    except Exception as e:
        logger.error(f"Xato {addr}: {e}", exc_info=True)
    finally:
        try:
            writer.close()
        except Exception:
            pass
        logger.info(f"Yopildi: {addr}")


class Command(BaseCommand):
    help = 'ISUP5.0 TCP server (to\'liq handshake bilan)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS(f'ISUP server port {ISUP_PORT} da ishga tushmoqda...'))
        asyncio.run(self.run_server())

    async def run_server(self):
        server = await asyncio.start_server(handle_device, '0.0.0.0', ISUP_PORT)
        async with server:
            self.stdout.write(self.style.SUCCESS(f'ISUP server tayyor. Port: {ISUP_PORT}'))
            await server.serve_forever()