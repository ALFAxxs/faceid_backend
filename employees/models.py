from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=200, verbose_name='Bo\'lim nomi')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bo\'lim'
        verbose_name_plural = 'Bo\'limlar'

    def __str__(self):
        return self.name


class Employee(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Faol'),
        (STATUS_INACTIVE, 'Nofaol'),
    ]

    employee_id = models.CharField(max_length=50, unique=True, verbose_name='Xodim ID')
    first_name = models.CharField(max_length=100, verbose_name='Ism')
    last_name = models.CharField(max_length=100, verbose_name='Familiya')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    position = models.CharField(max_length=200, verbose_name='Lavozim')
    phone = models.CharField(max_length=20, blank=True)
    face_id = models.CharField(max_length=100, blank=True, verbose_name='Face ID (qurilmadagi)')
    card_number = models.CharField(max_length=50, blank=True, verbose_name='Karta raqami')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    photo = models.ImageField(upload_to='employees/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Xodim'
        verbose_name_plural = 'Xodimlar'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name} {self.first_name}"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"
