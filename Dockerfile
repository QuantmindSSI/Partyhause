# --- Build stage ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Vite inlines VITE_* env vars at BUILD time, so they must be supplied as
# build args here (not runtime env vars). Passed in from deploy.yml / docker build.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_APP_NAME=PartyHause
ARG VITE_APP_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_URL=$VITE_APP_URL

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
