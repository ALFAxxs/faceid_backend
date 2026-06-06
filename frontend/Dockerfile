# Frontend: build (Node) + serve/proxy (nginx)
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Production'da bo'sh -> SPA nisbiy '/api' va same-origin WebSocket ishlatadi (nginx bir domen)
ENV VITE_API_URL=""
ENV VITE_WS_URL=""
RUN npm run build

# --- nginx ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
