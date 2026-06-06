from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AccessEvent, WorkSession
from .serializers import AccessEventSerializer, WorkSessionSerializer

class AccessEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccessEvent.objects.select_related('device', 'employee').all()
    serializer_class = AccessEventSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'device__name']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        event_type = self.request.query_params.get('event_type')
        employee_id = self.request.query_params.get('employee_id')
        if date:
            qs = qs.filter(timestamp__date=date)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

class WorkSessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkSession.objects.select_related('employee').all()
    serializer_class = WorkSessionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        employee_id = self.request.query_params.get('employee_id')
        month = self.request.query_params.get('month')
        if date:
            qs = qs.filter(date=date)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if month:
            year, mon = month.split('-')
            qs = qs.filter(date__year=year, date__month=mon)
        return qs
