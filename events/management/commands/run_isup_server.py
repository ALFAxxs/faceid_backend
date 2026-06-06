"""
ISUP5.0 TCP server — qurilmalar shu portga ulanib event yuboradi.
Usage: python manage.py run_isup_server
"""
import asyncio
import json
import logging
import struct
import django
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

ISUP_PORT = 7332
ISUP_HEADER_SIZE = 32


def parse_isup_packet(data: bytes) -> dict | None:
    """
    ISUP5.0 paketini parse qiladi.
    Real qurilmadan kelgan paketni decode qiladi.
    """
    try:
        if len(data) < ISUP_HEADER_SIZE:
            return None

        # ISUP header: magic(4) + version(1) + msg_type(1) + seq(4) + length(4) + ...
        magic = data[:4]
        if magic != b'ISUP':
            # Ba'zi qurilmalar JSON yuboradi — tekshirib ko'ramiz
            try:
                return json.loads(data.decode('utf-8', errors='ignore'))
            except Exception:
                return None

        msg_type = data[5]
        payload_len = struct.unpack('>I', data[8:12])[0]
        payload = data[ISUP_HEADER_SIZE:ISUP_HEADER_SIZE + payload_len]

        try:
            return json.loads(payload.decode('utf-8'))
        except Exception:
            return {'raw_bytes': payload.hex(), 'msg_type': msg_type}

    except Exception as e:
        logger.error(f"Paket parse xatosi: {e}")
        return None


from events.services import save_access_event, event_payload


@sync_to_async
def save_event(device_id: str, event_data: dict):
    """Eventni saqlaydi (umumiy services.save_access_event ustidan)."""
    try:
        return save_access_event(device_id, event_data)
    except Exception as e:
        logger.error(f"Event saqlash xatosi: {e}")
        return None


async def handle_device(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """Har bir qurilma uchun TCP ulanishni boshqaradi."""
    addr = writer.get_extra_info('peername')
    device_id = None
    channel_layer = get_channel_layer()

    logger.info(f"Yangi ulanish: {addr}")

    try:
        while True:
            # Paket o'lchami (4 bayt header)
            header = await asyncio.wait_for(reader.read(4), timeout=60.0)
            if not header:
                break

            # To'liq paketni o'qish
            data = header + await reader.read(4096)
            parsed = parse_isup_packet(data)

            if not parsed:
                continue

            # Device ID ni olish
            if not device_id:
                device_id = (
                    parsed.get('deviceID') or
                    parsed.get('deviceId') or
                    parsed.get('serialNo', str(addr[0]))
                )

            # Access event ekanligini tekshirish
            event_keys = {'employeeNo', 'cardNo', 'type', 'eventType'}
            if not event_keys.isdisjoint(parsed.keys()):
                event = await save_event(device_id, parsed)

                if event and channel_layer:
                    # WebSocket orqali frontendga yuborish
                    await channel_layer.group_send(
                        'events_live',
                        {'type': 'event.new', 'data': event_payload(event, device_id)},
                    )
                    logger.info(f"Event saqlandi: {event}")

            # ACK yuborish
            writer.write(b'\x00\x00\x00\x01')
            await writer.drain()

    except asyncio.TimeoutError:
        logger.info(f"Qurilma timeout: {addr}")
    except ConnectionResetError:
        logger.info(f"Qurilma uzildi: {addr}")
    except Exception as e:
        logger.error(f"Ulanish xatosi {addr}: {e}")
    finally:
        writer.close()
        logger.info(f"Ulanish yopildi: {addr}")


class Command(BaseCommand):
    help = 'ISUP5.0 TCP server ishga tushiradi (port 7332)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('ISUP server port 7332 da ishga tushmoqda...'))
        asyncio.run(self.run_server())

    async def run_server(self):
        server = await asyncio.start_server(handle_device, '0.0.0.0', ISUP_PORT)
        async with server:
            self.stdout.write(self.style.SUCCESS(f'ISUP server tayyor. Qurilmalar {ISUP_PORT} portga ulansin.'))
            await server.serve_forever()
