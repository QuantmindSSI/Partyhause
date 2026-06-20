# --- Build stage ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Fix tsconfig for web build (remove expo dependency)
RUN sed -i '/"extends": "expo/d' tsconfig.json || true

# Build the Vite PWA
RUN npm run build:web

# --- Serve stage ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: route everything to index.html
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
