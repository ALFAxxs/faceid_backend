# Backend (Django + Channels/ASGI) production image
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Tizim bog'liqliklari (psycopg2/pillow uchun runtime kutubxonalar binar wheel'larda keladi)
RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
# Standart buyruq: ASGI server (web). ISUP servisi compose'da boshqa buyruq beradi.
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
