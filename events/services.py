"""
Event saqlash va real-time broadcast uchun umumiy mantiq.

Bu modul ham ISUP TCP server (run_isup_server.py), ham ISAPI HTTP webhook
(isapi.py) tomonidan ishlatiladi — kod takrorlanmasligi uchun.
"""
import logging
from datetime import date

from django.db import models
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

GROUP = 'events_live'


def save_access_event(device_id: str, event_data: dict):
    """
    Eventni bazaga saqlaydi, qurilma statusini va WorkSession'ni yangilaydi.
    Sinxron (oddiy ORM) — async kontekstda sync_to_async bilan o'rang.
    """
    from devices.models import Device
    from employees.models import Employee
    from events.models import AccessEvent, WorkSession

    device = Device.objects.filter(device_id=device_id).first()
    if not device:
        logger.warning("Noma'lum qurilma: %s", device_id)
        return None

    # Qurilma online deb belgilanadi
    device.status = Device.STATUS_ONLINE
    device.last_seen = timezone.now()
    device.save(update_fields=['status', 'last_seen'])

    # Xodimni topish (employeeNo yoki cardNo bo'yicha)
    employee = None
    emp_id = event_data.get('employeeNo') or event_data.get('cardNo')
    if emp_id:
        employee = Employee.objects.filter(
            models.Q(employee_id=emp_id) | models.Q(card_number=emp_id)
        ).first()

    # Yo'nalish qurilma sozlamasidan olinadi
    event_type = (
        AccessEvent.EVENT_ENTRY if device.direction == 'entry' else AccessEvent.EVENT_EXIT
    )

    event = AccessEvent.objects.create(
        device=device,
        employee=employee,
        event_type=event_type,
        verify_type=event_data.get('verify_type', AccessEvent.VERIFY_FACE),
        timestamp=timezone.now(),
        is_authorized=event_data.get('type', '') != 'illegalAccess',
        raw_data=event_data,
        temperature=event_data.get('temperature'),
        mask_detected=event_data.get('mask'),
    )

    # WorkSession (ish sessiyasi) yangilash
    if employee:
        today = date.today()
        session, _ = WorkSession.objects.get_or_create(employee=employee, date=today)
        if event_type == AccessEvent.EVENT_ENTRY and not session.entry_time:
            session.entry_time = event.timestamp
            session.entry_event = event
            session.save(update_fields=['entry_time', 'entry_event'])
        elif event_type == AccessEvent.EVENT_EXIT:
            session.exit_time = event.timestamp
            session.exit_event = event
            session.save(update_fields=['exit_time', 'exit_event'])
            session.calculate_duration()

    return event


def event_payload(event, device_id: str) -> dict:
    """Frontendga yuboriladigan WebSocket payload."""
    return {
        'id': event.id,
        'device_id': device_id,
        'employee': str(event.employee) if event.employee else None,
        'event_type': event.event_type,
        'timestamp': event.timestamp.isoformat(),
        'is_authorized': event.is_authorized,
        'temperature': event.temperature,
    }


def broadcast_event_sync(event, device_id: str):
    """Sinxron kontekstdan (masalan HTTP view) WebSocket'ga broadcast."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        GROUP, {'type': 'event.new', 'data': event_payload(event, device_id)}
    )
