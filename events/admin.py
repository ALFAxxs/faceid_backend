from django.contrib import admin
from .models import AccessEvent, WorkSession

@admin.register(AccessEvent)
class AccessEventAdmin(admin.ModelAdmin):
    list_display = ['employee', 'device', 'event_type', 'timestamp', 'is_authorized']
    list_filter = ['event_type', 'is_authorized', 'device']
    search_fields = ['employee__first_name', 'employee__last_name']
    date_hierarchy = 'timestamp'

@admin.register(WorkSession)
class WorkSessionAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'entry_time', 'exit_time', 'duration_minutes']
    list_filter = ['date']
    search_fields = ['employee__first_name', 'employee__last_name']
