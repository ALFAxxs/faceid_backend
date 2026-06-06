#!/bin/bash
set -e
DOMAIN="faceid.markaziyklinikkasalxona-statistika.uz"
EMAIL="admin@markaziyklinikkasalxona-statistika.uz"  # <- emailingizni yozing

echo "======================================"
echo "  FaceID Deploy — $DOMAIN"
echo "======================================"

# 1. Docker o'rnatish
if ! command -v docker &> /dev/null; then
    echo "[1/6] Docker o'rnatilmoqda..."
    curl -fsSL https://get.docker.com | sh
else
    echo "[1/6] Docker allaqachon bor ✓"
fi

# 2. Loyihani joylashtirish
echo "[2/6] Loyiha joylashtirilmoqda..."
cd /opt/faceid

# 3. Frontend API URL ni domenga o'zgartirish
echo "[3/6] Frontend API URL sozlanmoqda..."
sed -i "s|http://localhost:8000|https://$DOMAIN|g" frontend/src/api/axios.ts 2>/dev/null || true
sed -i "s|ws://localhost:8000|wss://$DOMAIN|g" frontend/src/hooks/useWebSocket.ts 2>/dev/null || true

# 4. Nginx conf va env fayllarni ko'chirish
echo "[4/6] Config fayllar o'rnatilmoqda..."
# (fayllar allaqachon /opt/faceid/ da bo'lishi kerak)

# 5. Firewall
echo "[5/6] Firewall sozlanmoqda..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 7332
ufw --force enable

# 6. Avval HTTP bilan ishga tushirish (sertifikat olish uchun)
echo "[6/6] Servislar ishga tushirilmoqda (HTTP)..."

# Vaqtinchalik HTTP nginx config
cat > /tmp/nginx-temp.conf << 'NGINX'
server {
    listen 80;
    server_name faceid.markaziyklinikkasalxona-statistika.uz;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINX

cp /tmp/nginx-temp.conf nginx-temp.conf
docker compose up -d db redis
sleep 5
docker compose up -d web isup

# Vaqtinchalik frontend (faqat certbot uchun)
docker run -d --name nginx-temp \
    -p 80:80 \
    -v /opt/faceid/nginx-temp.conf:/etc/nginx/conf.d/default.conf:ro \
    -v certbot_www:/var/www/certbot \
    nginx:alpine || true

sleep 3

# SSL sertifikat olish
echo ""
echo "SSL sertifikat olinmoqda..."
docker run --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v certbot_www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Vaqtinchalik nginx o'chirish
docker stop nginx-temp && docker rm nginx-temp || true

# HTTPS bilan to'liq ishga tushirish
echo ""
echo "HTTPS bilan to'liq ishga tushirilmoqda..."
docker compose up -d --build

# Admin yaratish
echo ""
echo "Admin foydalanuvchi yaratilmoqda..."
sleep 10
docker compose exec web python manage.py createsuperuser --noinput \
    --username admin \
    --email admin@markaziyklinikkasalxona-statistika.uz 2>/dev/null || \
    echo "Admin allaqachon bor yoki qo'lda yarating: docker compose exec web python manage.py createsuperuser"

echo ""
echo "======================================"
echo "  TAYYOR!"
echo "======================================"
echo ""
echo "  Sayt:        https://$DOMAIN"
echo "  Admin:       https://$DOMAIN/admin/"
echo "  API:         https://$DOMAIN/api/"
echo "  ISUP port:   7332"
echo ""
echo "  Qurilmalar sozlamasi:"
echo "  Alarm Center IP:    164.92.130.93"
echo "  Alarm Center Port:  7332"
echo ""
