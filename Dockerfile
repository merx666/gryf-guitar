# Multi-stage Dockerfile dla Gryf Guitar
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiowanie zależności
COPY package*.json ./
RUN npm ci

# Kopiowanie kodu źródłowego i budowanie aplikacji
COPY . .
RUN npm run build

# Serwowanie przez lekki Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
