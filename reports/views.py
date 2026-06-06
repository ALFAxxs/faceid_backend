from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
from events.models import AccessEvent, WorkSession

class DashboardStatsView(APIView):
    def get(self, request):
        today = timezone.now().date()
        return Response({
            'today_entries': AccessEvent.objects.filter(
                timestamp__date=today, event_type='entry').count(),
            'today_exits': AccessEvent.objects.filter(
                timestamp__date=today, event_type='exit').count(),
            'currently_inside': WorkSession.objects.filter(
                date=today, entry_time__isnull=False, exit_time__isnull=True).count(),
            'avg_work_hours': WorkSession.objects.filter(
                date=today, duration_minutes__isnull=False
            ).aggregate(avg=Avg('duration_minutes'))['avg'],
        })
