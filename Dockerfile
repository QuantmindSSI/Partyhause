# --- Build stage ---
FROM node:22.22.0-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# --legacy-peer-deps is required, not defensive. The lockfile is written by a
# resolver running with that flag, and bare `npm ci` recomputes an ideal tree
# that disagrees with it, then refuses to install:
#
#   Invalid: lock file's picomatch@2.3.2 does not satisfy picomatch@4.0.7
#   Missing: picomatch@2.3.2 from lock file
#
# which reads as a corrupt lockfile and is not one. The same lockfile installs
# cleanly with the flag. AGENTS.md documents it for local installs; every
# automated install path had omitted it, so this image could not be built at
# all until 2026-09-10.
RUN npm ci --legacy-peer-deps

COPY . .

# Vite inlines VITE_* env vars at BUILD time, so they must be supplied as
# build args here (not runtime env vars). Passed in from deploy.yml / docker build.
ARG VITE_API_URL
ARG VITE_APP_NAME=PartyHause
ARG VITE_APP_URL
ARG VITE_ENTRA_TENANT_ID
ARG VITE_ENTRA_SPA_CLIENT_ID
ARG VITE_ENTRA_POLICY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID
ENV VITE_ENTRA_SPA_CLIENT_ID=$VITE_ENTRA_SPA_CLIENT_ID
ENV VITE_ENTRA_POLICY=$VITE_ENTRA_POLICY

# Fix tsconfig for web build (remove expo dependency)
RUN sed -i '/"extends": "expo/d' tsconfig.json || true

# Build the Vite PWA
RUN npm run build:web

# --- Serve stage ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Cache policy plus the SPA fallback. This was an inline `RUN echo` config that
# set no Cache-Control on any response, which left every URL to heuristic
# browser caching and stranded service-worker clients on a stale precache.
# See nginx.conf for the full reasoning.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fail the build rather than ship a container that will not start.
RUN nginx -t

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
