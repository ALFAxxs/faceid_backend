#!/bin/sh
set -e

# Ma'lumotlar bazasi tayyor bo'lishini kutamiz (DB_HOST/DB_PORT berilgan bo'lsa)
if [ -n "$DB_HOST" ]; then
  echo "DB ($DB_HOST:${DB_PORT:-5432}) kutilmoqda..."
  until nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
    sleep 1
  done
  echo "DB tayyor."
fi

# Migratsiya va static fayllar faqat web servisida (RUN_MIGRATIONS=1) bajariladi
if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "Migratsiyalar..."
  python manage.py migrate --noinput
  echo "Static fayllar..."
  python manage.py collectstatic --noinput
fi

exec "$@"
