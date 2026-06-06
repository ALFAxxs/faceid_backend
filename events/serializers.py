from rest_framework import serializers
from .models import AccessEvent, WorkSession
from employees.serializers import EmployeeSerializer
from devices.serializers import DeviceSerializer

class AccessEventSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = AccessEvent
        fields = '__all__'

class WorkSessionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = WorkSession
        fields = '__all__'

    def get_duration_hours(self, obj):
        if obj.duration_minutes:
            return round(obj.duration_minutes / 60, 2)
        return None
