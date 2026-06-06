# Real Hikvision FaceID qurilmasi bilan lokal sinash

Qo'llanma DS-K1T341CM (va shunga o'xshash Hikvision yuz tanish terminallari) uchun.

Backend qurilmadan eventlarni **ikki yo'l** bilan oladi:

| Yo'l | Port/URL | Qachon ishlatiladi |
|------|----------|--------------------|
| **ISAPI HTTP webhook** ✅ tavsiya | `POST /api/isapi/event/` (8000) | Real qurilma — eng sodda va ishonchli |
| **ISUP TCP server** | TCP `7332` | Soddalashtirilgan; to'liq ISUP5.0 SDK talab qiladi |

---

## 1. Tarmoq tayyorgarligi

1. Qurilma va kompyuterni **bitta tarmoqqa** (router/switch) ulang.
2. Qurilma IP'sini toping — Hikvision **SADP** tool yoki qurilma ekrani → Network.
3. Kompyuter IP'sini biling: `ipconfig` (masalan `192.168.1.50`).
4. Windows Firewall'da 8000-portga ruxsat bering (yoki test uchun vaqtincha o'chiring):
   ```powershell
   New-NetFirewallRule -DisplayName "FaceID 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```
5. Backend'ni **0.0.0.0** ga bog'lab ishga tushiring (tashqaridan ko'rinishi uchun):
   ```powershell
   .\.venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 config.asgi:application
   ```
6. `.env` / settings'da `ALLOWED_HOSTS` ichiga kompyuter IP'sini qo'shing (masalan `192.168.1.50`).

---

## 2. Qurilmani DB'ga qo'shish

Admin panel (`http://localhost:8000/admin/`) yoki frontend → Qurilmalar orqali yangi qurilma yarating. Webhook qurilmani quyidagi tartibda aniqlaydi:

1. `?device_id=` query parametri (eng aniq — pastga qarang), **yoki**
2. payload'dagi `ipAddress` → `Device.ip_address` mosligi, **yoki**
3. `serialNo` → `Device.serial_number` mosligi.

> Maslahat: har bir qurilma uchun **`device_id`** ni belgilab, webhook URL'iga qo'shib qo'ying — bu eng ishonchli.

---

## 3. Qurilmani event yuborishga sozlash (ISAPI HTTP Listening)

Qurilma web-interfeysi (`http://<qurilma_ip>`) → quyidagilardan birini toping (firmware'ga qarab nomi farq qiladi):

- **Configuration → Network → Advanced Settings → HTTP Listening**, yoki
- **Configuration → Event → Basic Event → Linkage → Notify Surveillance Center**, yoki ISAPI orqali `Event/notification/httpHosts`.

Sozlamalar:

| Maydon | Qiymat |
|--------|--------|
| Destination IP / URL | `192.168.1.50` (kompyuter IP) |
| Port | `8000` |
| URL | `/api/isapi/event/?device_id=door_entry_1` |
| Protocol | HTTP |
| Format | JSON (agar tanlash mumkin bo'lsa) |

Saqlang. Endi qurilma har kirish/chiqishda shu URL'ga POST qiladi.

### ISAPI orqali sozlash (ixtiyoriy, curl)
```bash
curl -u admin:PAROL --digest -X PUT "http://<qurilma_ip>/ISAPI/Event/notification/httpHosts" \
  -H "Content-Type: application/json" -d '{
    "HttpHostNotificationList": [{
      "id": 1, "url": "/api/isapi/event/?device_id=door_entry_1",
      "protocolType": "HTTP", "parameterFormatType": "JSON",
      "addressingFormatType": "ipaddress",
      "ipAddress": "192.168.1.50", "portNo": 8000,
      "httpAuthenticationMethod": "none"
    }]
  }'
```

---

## 4. Sinash

1. Qurilmada yuzingizni ko'rsating (yoki karta bosing).
2. Backend logida event ko'rinadi; DB'ga `AccessEvent` yoziladi.
3. Frontend dashboard (`http://localhost:3000`) real-time lentada darhol ko'rsatadi.

Tekshirish:
```powershell
# Oxirgi eventlar (JWT token bilan)
Invoke-RestMethod "http://localhost:8000/api/events/" -Headers @{Authorization="Bearer <ACCESS>"}
```

---

## 5. Qurilmasiz sinash — simulyator

Real qurilma bo'lmasa, butun zanjirni soxta eventlar bilan sinash mumkin:

```powershell
# ISAPI webhook orqali (real qurilma yo'lini taqlid qiladi)
.\.venv\Scripts\python.exe tools\device_simulator.py --mode http --device door_entry_1 --employee EMP001

# Ruxsatsiz kirish
.\.venv\Scripts\python.exe tools\device_simulator.py --mode http --device door_exit_1 --employee EMP001 --denied

# ISUP TCP server orqali
.\.venv\Scripts\python.exe tools\device_simulator.py --mode tcp --device door_entry_1 --card 12345

# Ketma-ket 5 ta event, 2 sekunddan
.\.venv\Scripts\python.exe tools\device_simulator.py --mode http --device door_entry_1 --employee EMP001 --count 5 --interval 2
```

---

## Cheklovlar / eslatmalar

- **ISUP5.0 (TCP 7332)** to'liq implementatsiya emas — real ISUP qurilma registratsiya handshake, heartbeat va binar/shifrlangan paketlar yuboradi. To'liq qo'llab-quvvatlash uchun Hikvision **ISUP SDK** (HCNetSDK / EHomeSDK) kerak. Shu sabab real qurilma uchun **ISAPI webhook** tavsiya etiladi.
- Webhook autentifikatsiyasiz (`AllowAny`) — qurilma JWT yubora olmaydi. Faqat **ishonchli lokal tarmoqda** ishlating. Internetga chiqarsangiz, IP-allowlist yoki maxfiy token (URL'da `?token=`) qo'shing.
- `subEventType` kodlari firmware'ga qarab farq qiladi — ruxsatsiz eventlarni to'g'ri ajratish uchun [events/isapi.py](events/isapi.py) dagi `DENIED_SUBEVENT_TYPES` ni sozlang.
- Webhook va ISUP server endi bitta umumiy mantiqdan foydalanadi: [events/services.py](events/services.py).
