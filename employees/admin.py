from django.contrib import admin
from .models import Employee, Department

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'employee_id', 'department', 'position', 'status']
    list_filter = ['department', 'status']
    search_fields = ['first_name', 'last_name', 'employee_id']
