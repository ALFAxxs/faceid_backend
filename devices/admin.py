from django.contrib import admin
from .models import Device

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'device_id', 'direction', 'status', 'location', 'last_seen']
    list_filter = ['direction', 'status']
    search_fields = ['name', 'device_id']
