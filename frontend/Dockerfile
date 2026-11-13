# Chakravyuh web app. Build context: frontend/
#   docker build --build-arg VITE_API_BASE_URL=https://your-api.example.com -t chakravyuh-web frontend
# VITE_API_BASE_URL is baked into the JS at build time and shipped to the browser: never put secrets in it.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
