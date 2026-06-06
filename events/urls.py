from rest_framework.routers import DefaultRouter
from .views import AccessEventViewSet, WorkSessionViewSet

router = DefaultRouter()
router.register('sessions', WorkSessionViewSet)
router.register('', AccessEventViewSet)
urlpatterns = router.urls
