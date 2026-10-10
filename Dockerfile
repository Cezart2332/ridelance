FROM node:25-alpine AS build

# Chromium pentru pre-randarea paginilor publice (scripts/prerender.mjs). Rămâne în etapa de build;
# imaginea finală e doar nginx cu fișierele rezultate.
RUN apk add --no-cache chromium
ENV PRERENDER_CHROMIUM=/usr/bin/chromium

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci

COPY ./ ./

# Vite coace variabilele `VITE_*` în bundle la build; nu le citește la rulare. Setate doar ca env
# de runtime, nu ajung niciodată la `npm run build`, iar bundle-ul iese cu valoarea goală — harta
# randează „lipsește tokenul" pe un deploy unde tokenul chiar e setat. Platforma trebuie să le
# trimită ca build args, iar build args nu ajung la `RUN` fără `ARG` declarat aici.
#
# În Coolify: fiecare variabilă are un comutator „Build Variable"; fără el rămâne doar la runtime.
ARG VITE_API_BASE_URL
ARG VITE_MAPBOX_TOKEN
ARG VITE_PUBLIC_STRIPE

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN \
    VITE_PUBLIC_STRIPE=$VITE_PUBLIC_STRIPE

# Pre-randarea vine imediat după build: fără ea, serverul ar răspunde pe orice adresă cu același
# HTML gol. Dacă o pagină nu se poate pre-randa, build-ul se oprește — mai bine fără imagine nouă
# decât cu un site invizibil pentru motoarele de căutare.
RUN npm run build && node scripts/prerender.mjs

FROM nginx:stable-alpine AS production



COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
