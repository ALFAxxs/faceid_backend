from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from events.isapi import isapi_event

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/isapi/event/', isapi_event, name='isapi_event'),
    path('api/devices/', include('devices.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/events/', include('events.urls')),
    path('api/reports/', include('reports.urls')),
]
