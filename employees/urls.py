from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, DepartmentViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet)
router.register('', EmployeeViewSet)
urlpatterns = router.urls
