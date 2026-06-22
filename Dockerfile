FROM node:25-alpine AS build

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY ./ ./

RUN npm run build

FROM nginx:stable-alpine AS production



COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
