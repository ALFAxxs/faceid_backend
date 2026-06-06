#!/bin/bash
echo "=== FaceID Backend ==="

# 1. Migrate
python manage.py migrate

# 2. Superuser (agar yo'q bo'lsa)
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@faceid.uz', 'admin123')
    print('Superuser yaratildi: admin / admin123')
"

# 3. Django server (ASGI)
echo "Django server ishga tushmoqda: http://localhost:8000"
daphne -b 0.0.0.0 -p 8000 config.asgi:application &

# 4. ISUP TCP server
echo "ISUP server ishga tushmoqda: port 7332"
python manage.py run_isup_server
