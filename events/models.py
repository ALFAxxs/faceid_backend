from django.db import models
from devices.models import Device
from employees.models import Employee

class AccessEvent(models.Model):
    EVENT_ENTRY = 'entry'
    EVENT_EXIT = 'exit'
    EVENT_TYPES = [
        (EVENT_ENTRY, 'Kirish'),
        (EVENT_EXIT, 'Chiqish'),
    ]

    VERIFY_FACE = 'face'
    VERIFY_CARD = 'card'
    VERIFY_FACE_CARD = 'face_card'
    VERIFY_TYPES = [
        (VERIFY_FACE, 'Yuz tanish'),
        (VERIFY_CARD, 'Karta'),
        (VERIFY_FACE_CARD, 'Yuz + Karta'),
    ]

    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, related_name='events')
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    verify_type = models.CharField(max_length=20, choices=VERIFY_TYPES, default=VERIFY_FACE)
    timestamp = models.DateTimeField(verbose_name='Vaqt')
    is_authorized = models.BooleanField(default=True, verbose_name='Ruxsat berilgan')
    raw_data = models.JSONField(default=dict, verbose_name='ISUP raw data')
    temperature = models.FloatField(null=True, blank=True, verbose_name='Harorat (agar bo\'lsa)')
    mask_detected = models.BooleanField(null=True, blank=True, verbose_name='Niqob')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Kirish/chiqish eventi'
        verbose_name_plural = 'Kirish/chiqish eventlari'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['device', 'timestamp']),
            models.Index(fields=['employee', 'timestamp']),
        ]

    def __str__(self):
        emp = self.employee or 'Noma\'lum'
        return f"{emp} — {self.get_event_type_display()} — {self.timestamp:%Y-%m-%d %H:%M}"


class WorkSession(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField(verbose_name='Sana')
    entry_time = models.DateTimeField(null=True, blank=True, verbose_name='Kelish vaqti')
    exit_time = models.DateTimeField(null=True, blank=True, verbose_name='Ketish vaqti')
    entry_event = models.ForeignKey(AccessEvent, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    exit_event = models.ForeignKey(AccessEvent, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    duration_minutes = models.IntegerField(null=True, blank=True, verbose_name='Ishlagan vaqt (daqiqa)')

    class Meta:
        verbose_name = 'Ish sessiyasi'
        verbose_name_plural = 'Ish sessiyalari'
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def calculate_duration(self):
        if self.entry_time and self.exit_time:
            delta = self.exit_time - self.entry_time
            self.duration_minutes = int(delta.total_seconds() / 60)
            self.save(update_fields=['duration_minutes'])
