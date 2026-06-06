"""
FaceID qurilma simulyatori — real qurilmasiz butun zanjirni sinash uchun.

Ikki rejim:
  tcp   — ISUP TCP serverga (port 7332) JSON event yuboradi
  http  — ISAPI webhookka (POST /api/isapi/event/) Hikvision uslubidagi JSON yuboradi

Namunalar:
  python tools/device_simulator.py --mode http --device door_entry_1 --employee EMP001
  python tools/device_simulator.py --mode tcp  --device door_entry_1 --card 12345
  python tools/device_simulator.py --mode http --device door_exit_1  --employee EMP001 --denied
  python tools/device_simulator.py --mode http --device door_entry_1 --employee EMP001 --count 5 --interval 2
"""
import argparse
import json
import socket
import time
import urllib.request


def send_tcp(host: str, port: int, payload: dict):
    with socket.create_connection((host, port), timeout=5) as s:
        s.sendall(json.dumps(payload).encode())
        try:
            ack = s.recv(4)
            return f"ACK={ack.hex()}"
        except socket.timeout:
            return "ACK yo'q (timeout)"


def send_http(url: str, payload: dict):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data, headers={'Content-Type': 'application/json'}, method='POST'
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return f"HTTP {resp.status}: {resp.read().decode()}"


def build_tcp_payload(args) -> dict:
    """ISUP TCP server kutadigan sodda JSON."""
    p = {'deviceID': args.device, 'type': 'illegalAccess' if args.denied else 'normalAccess'}
    if args.employee:
        p['employeeNo'] = args.employee
    if args.card:
        p['cardNo'] = args.card
    if args.temp is not None:
        p['temperature'] = args.temp
    return p


def build_http_payload(args) -> dict:
    """Hikvision ISAPI AccessControllerEvent uslubidagi JSON."""
    ace = {
        'majorEventType': 5,
        'subEventType': 76 if args.denied else 75,
        'currentVerifyMode': 'face',
        'serialNo': 1001,
    }
    if args.employee:
        ace['employeeNoString'] = args.employee
        ace['name'] = 'Test Xodim'
    if args.card:
        ace['cardNo'] = args.card
    if args.temp is not None:
        ace['currTemperature'] = args.temp
        ace['mask'] = 'no'
    return {
        'ipAddress': '192.168.1.101',
        'dateTime': time.strftime('%Y-%m-%dT%H:%M:%S+05:00'),
        'eventType': 'AccessControllerEvent',
        'AccessControllerEvent': ace,
    }


def main():
    ap = argparse.ArgumentParser(description='FaceID qurilma simulyatori')
    ap.add_argument('--mode', choices=['tcp', 'http'], default='http')
    ap.add_argument('--device', default='door_entry_1', help='Device ID (DB dagi)')
    ap.add_argument('--employee', help='Xodim ID (employeeNo)')
    ap.add_argument('--card', help='Karta raqami (cardNo)')
    ap.add_argument('--temp', type=float, default=36.6, help='Harorat')
    ap.add_argument('--denied', action='store_true', help='Ruxsatsiz kirish sifatida')
    ap.add_argument('--count', type=int, default=1, help='Necha marta yuborish')
    ap.add_argument('--interval', type=float, default=1.0, help='Yuborishlar orasidagi sekund')
    ap.add_argument('--host', default='127.0.0.1')
    ap.add_argument('--tcp-port', type=int, default=7332)
    ap.add_argument('--http-url', default='http://127.0.0.1:8000/api/isapi/event/')
    args = ap.parse_args()

    for i in range(args.count):
        if args.mode == 'tcp':
            payload = build_tcp_payload(args)
            result = send_tcp(args.host, args.tcp_port, payload)
        else:
            payload = build_http_payload(args)
            url = args.http_url
            if '?' not in url:
                url += f'?device_id={args.device}'
            result = send_http(url, payload)
        print(f"[{i + 1}/{args.count}] {args.mode.upper()} -> {result}")
        if i + 1 < args.count:
            time.sleep(args.interval)


if __name__ == '__main__':
    main()
