"""
Hikvision ISAPI HTTP event qabul qiluvchi webhook.

Real qurilma (DS-K1T341CM) "HTTP Listening / Notify Surveillance Center"
sozlamasi orqali har kirish/chiqishda shu endpointga JSON (yoki multipart)
POST qiladi. Biz uni modelga moslab saqlaymiz va WebSocket'ga broadcast qilamiz.

Endpoint:  POST /api/isapi/event/?device_id=<device_id>
Auth:      yo'q (qurilma JWT yubora olmaydi) — lokal/ishonchli tarmoqda ishlating.
"""
import json
import logging

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from devices.models import Device
from .services import save_access_event, broadcast_event_sync

logger = logging.getLogger(__name__)

# Hikvision subEventType kodlari orasida "rad etilgan/muvaffaqiyatsiz" deb
# hisoblanadiganlari. Firmware'ga qarab farq qilishi mumkin — kerakli kodlarni
# qo'shing. Bo'sh bo'lsa: hamma event ruxsat berilgan deb olinadi.
DENIED_SUBEVENT_TYPES = {1, 76, 77}  # masalan: autentifikatsiya muvaffaqiyatsiz


def _extract_payload(request) -> dict | None:
    """JSON yoki multipart POST tanasidan event ma'lumotini ajratib oladi."""
    ctype = (request.content_type or '').lower()

    # 1) Sof JSON
    if 'application/json' in ctype:
        if isinstance(request.data, dict):
            return request.data
        try:
            return json.loads(request.body.decode('utf-8'))
        except Exception:
            return None

    # 2) Multipart/form-data — Hikvision ko'pincha JSON'ni alohida "field" sifatida,
    #    rasmlarni esa fayl sifatida yuboradi. JSON bo'lgan birinchi maydonni topamiz.
    for value in request.data.values():
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                continue

    # 3) Yuklangan fayllar orasida JSON bo'lishi mumkin (event_log)
    for f in request.FILES.values():
        try:
            parsed = json.loads(f.read().decode('utf-8'))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue

    return None


def _resolve_device(request, payload: dict) -> Device | None:
    """Qurilmani aniqlaydi: ?device_id= → ipAddress → serialNo bo'yicha."""
    qp = request.query_params.get('device_id')
    if qp:
        return Device.objects.filter(device_id=qp).first()

    ace = payload.get('AccessControllerEvent', {})
    ip = payload.get('ipAddress')
    if ip:
        dev = Device.objects.filter(ip_address=ip).first()
        if dev:
            return dev

    serial = ace.get('serialNo') or payload.get('serialNo')
    if serial:
        return Device.objects.filter(serial_number=str(serial)).first()

    return None


def _to_event_data(payload: dict) -> dict:
    """Hikvision AccessControllerEvent maydonlarini ichki formatga o'giradi."""
    ace = payload.get('AccessControllerEvent', payload)

    sub = ace.get('subEventType')
    denied = sub in DENIED_SUBEVENT_TYPES

    mask_raw = ace.get('mask')  # 'yes' / 'no' / None
    mask = {'yes': True, 'no': False}.get(str(mask_raw).lower()) if mask_raw is not None else None

    return {
        'employeeNo': ace.get('employeeNoString') or ace.get('employeeNo'),
        'cardNo': ace.get('cardNo'),
        'name': ace.get('name'),
        'type': 'illegalAccess' if denied else 'access',
        'verify_type': ace.get('currentVerifyMode', 'face'),
        'temperature': ace.get('currTemperature') or ace.get('temperature'),
        'mask': mask,
        'subEventType': sub,
        'majorEventType': ace.get('majorEventType'),
        'raw': payload,
    }


def _check_token(request) -> bool:
    """ISAPI_WEBHOOK_TOKEN sozlangan bo'lsa, so'rovdagi token mosligini tekshiradi."""
    expected = settings.ISAPI_WEBHOOK_TOKEN
    if not expected:
        return True  # token sozlanmagan (lokal dev) — tekshiruv o'chiq
    provided = (
        request.query_params.get('token')
        or request.headers.get('X-Webhook-Token')
        or ''
    )
    return provided == expected


@api_view(['POST'])
@authentication_classes([])      # JWT'ni o'tkazib yuboramiz
@permission_classes([AllowAny])  # global IsAuthenticated'ni bekor qilamiz
def isapi_event(request):
    if not _check_token(request):
        logger.warning("ISAPI: noto'g'ri yoki yo'q token")
        return Response({'detail': 'invalid token'}, status=401)

    payload = _extract_payload(request)
    if not payload:
        logger.warning("ISAPI: payload o'qib bo'lmadi (content-type=%s)", request.content_type)
        return Response({'detail': 'invalid payload'}, status=400)

    device = _resolve_device(request, payload)
    if not device:
        logger.warning("ISAPI: qurilma aniqlanmadi")
        return Response({'detail': 'unknown device'}, status=404)

    event_data = _to_event_data(payload)

    # Faqat haqiqiy access eventlarni saqlaymiz (heartbeat/video eventlarni emas)
    if not (event_data.get('employeeNo') or event_data.get('cardNo')):
        # Identifikatsiyasiz event (masalan heartbeat) — qurilma online deb belgilab, o'tkazamiz
        device.refresh_from_db()
        return Response({'status': 'ignored (no identity)'}, status=200)

    try:
        event = save_access_event(device.device_id, event_data)
    except Exception as e:
        logger.error("ISAPI event saqlash xatosi: %s", e)
        return Response({'detail': 'save error'}, status=500)

    if not event:
        return Response({'detail': 'not saved'}, status=200)

    broadcast_event_sync(event, device.device_id)
    return Response({'status': 'ok', 'event_id': event.id}, status=201)
