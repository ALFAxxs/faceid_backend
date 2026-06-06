# FaceID Frontend

Hikvision FaceID tizimi uchun React + TypeScript dashboard.

## Tech stack
React 18 · Vite · TypeScript · TailwindCSS · React Router v6 · Axios · TanStack Query · Zustand · Recharts · date-fns

## Ishga tushirish

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

Backend `http://localhost:8000` da ishlab turishi kerak. Manzillarni `.env` da o'zgartirish mumkin:

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Backend bilan moslik haqida eslatmalar

- DRF list endpointlari paginatsiyalangan (`{count, next, previous, results}`) — API helperlar `results` ni qaytaradi, `/events/` esa to'liq paginatsiyani.
- `GET /api/reports/dashboard/` dagi `avg_work_hours` aslida **daqiqada** qaytadi (backend `duration_minutes` o'rtachasini beradi). Frontend uni 60 ga bo'lib soatga aylantiradi.
- `photo` nisbiy yo'l (`/media/...`) — `mediaUrl()` orqali to'liq URL ga aylantiriladi.
- `/api/events/` read-only (faqat GET). Qurilma bo'yicha filtr klient tarafida bajariladi (backend bu paramni qo'llamaydi).
- Login uchun: `admin / admin123` (backend `start.sh` yaratadigan superuser).

## Build

```bash
npm run build
```
