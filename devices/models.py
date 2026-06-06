from django.db import models

class Device(models.Model):
    DIRECTION_ENTRY = 'entry'
    DIRECTION_EXIT = 'exit'
    DIRECTION_CHOICES = [
        (DIRECTION_ENTRY, 'Kirish'),
        (DIRECTION_EXIT, 'Chiqish'),
    ]

    STATUS_ONLINE = 'online'
    STATUS_OFFLINE = 'offline'
    STATUS_CHOICES = [
        (STATUS_ONLINE, 'Online'),
        (STATUS_OFFLINE, 'Offline'),
    ]

    device_id = models.CharField(max_length=100, unique=True, verbose_name='Qurilma ID')
    name = models.CharField(max_length=200, verbose_name='Nomi')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP manzil')
    location = models.CharField(max_length=200, verbose_name='Joylashuv')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, verbose_name='Yo\'nalish')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_OFFLINE)
    firmware_version = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Qurilma'
        verbose_name_plural = 'Qurilmalar'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_direction_display()})"
