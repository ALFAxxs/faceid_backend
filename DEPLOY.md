# FaceID — Serverga deploy qilish (Docker Compose)

Bu qo'llanma butun tizimni (PostgreSQL + Redis + Django ASGI + ISUP server + React/nginx) bitta server'da Docker bilan ishga tushiradi.

## Arxitektura

```
                      Internet / LAN
                            │
                    ┌───────▼────────┐  :80 (/:443 TLS)
                    │  frontend      │  nginx: SPA + reverse proxy
                    │  (React+nginx) │
                    └───┬────────┬───┘
              /api /ws /admin     │ /media (volume)
                    ┌───▼────┐    │
                    │  web   │  daphne (ASGI: HTTP + WebSocket)
                    └─┬────┬─┘
        ┌─────────────┘    └──────────┐
   ┌────▼────┐   ┌──────┐        ┌────▼────┐
   │   db    │   │redis │        │  isup   │  TCP :7332 (ixtiyoriy)
   │postgres │   │      │        │ (worker)│
   └─────────┘   └──────┘        └─────────┘
```

Qurilma eventlari **ikki yo'l** bilan kiradi:
- **ISAPI webhook** (tavsiya): qurilma → `https://domen/api/isapi/event/?device_id=...&token=...`
- **ISUP TCP** (ixtiyoriy): qurilma → `server:7332`

---

## 1. Talablar
- Linux server (Ubuntu 22.04+), public IP yoki domen
- Docker + Docker Compose o'rnatilgan:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

## 2. Kodni serverga ko'chiring
```bash
git clone <repo>  # yoki fayllarni scp bilan tashlang
cd backend
```

## 3. Sozlamalarni to'ldiring
```bash
cp .env.production.example .env.production
nano .env.production
```
Quyidagilarni albatta o'zgartiring:
- `SECRET_KEY` — `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` — domeningiz
- `POSTGRES_PASSWORD` va `DATABASE_URL` ichidagi parol (bir xil bo'lsin)
- `ISAPI_WEBHOOK_TOKEN` — uzun tasodifiy token

> ⚠️ `.env.production`'ni hech qachon git'ga qo'shmang.

## 4. Ishga tushiring
```bash
docker compose up -d --build
```
`web` konteyneri avtomatik: DB kutadi → `migrate` → `collectstatic` → daphne.

Holatni ko'rish:
```bash
docker compose ps
docker compose logs -f web
```

## 5. Admin foydalanuvchi yarating
```bash
docker compose exec web python manage.py createsuperuser
```

## 6. Tekshiring
- Brauzer: `http://<server-ip>/` → login sahifasi
- Admin: `http://<server-ip>/admin/`

---

## 7. HTTPS (tavsiya — qurilma internet orqali ulansa SHART)

Eng oson yo'l — frontend oldiga Caddy yoki nginx + certbot qo'yish. Tezkor variant (Caddy avtomatik TLS):

`docker-compose.override.yml` yarating:
```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [frontend]
  frontend:
    ports: []   # 80'ni Caddy egallaydi
volumes:
  caddy_data:
```
`Caddyfile`:
```
faceid.example.uz {
    reverse_proxy frontend:80
}
```
So'ng `.env.production`'da `SECURE_SSL_REDIRECT=True` qiling va qayta ishga tushiring:
```bash
docker compose up -d
```
Caddy Let's Encrypt sertifikatini avtomatik oladi. Endi sayt `https://faceid.example.uz`.

---

## 8. Qurilmani ulash (production)

Qurilma web UI → HTTP Listening:
| Maydon | Qiymat |
|--------|--------|
| Event Alarm IP/Domain | `faceid.example.uz` (yoki server IP) |
| Port | `443` (HTTPS) yoki `80` (HTTP) |
| URL | `/api/isapi/event/?device_id=door_entry_1&token=<ISAPI_WEBHOOK_TOKEN>` |
| Protocol | HTTPS (tavsiya) |

Qurilmadagi `device_id` ilovadagi qurilma ID'si bilan bir xil bo'lsin.

To'liq qurilma sozlash: [REAL_DEVICE_SETUP.md](REAL_DEVICE_SETUP.md)

---

## Foydali buyruqlar
```bash
docker compose logs -f web isup      # loglar
docker compose restart web           # qayta ishga tushirish
docker compose down                  # to'xtatish
docker compose down -v               # to'xtatish + ma'lumotlarni o'chirish (ehtiyot!)
docker compose exec web python manage.py shell

# Ma'lumotlar bazasi zaxira nusxasi
docker compose exec db pg_dump -U faceid faceid_db > backup_$(date +%F).sql
```

## Yangilanish (yangi kod)
```bash
git pull
docker compose up -d --build
```

---

## Production tekshiruv ro'yxati
- [ ] `DEBUG=False`
- [ ] Kuchli `SECRET_KEY`
- [ ] To'g'ri `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS`
- [ ] Kuchli DB paroli
- [ ] `ISAPI_WEBHOOK_TOKEN` o'rnatilgan (webhook himoyasi)
- [ ] HTTPS yoqilgan, `SECURE_SSL_REDIRECT=True`
- [ ] Server firewall: 80/443 (va kerak bo'lsa 7332) ochiq; 8000/5432/6379 faqat ichkarida
- [ ] DB zaxira nusxasi rejasi
```
