FROM node:25-bookworm-slim As build

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci 

COPY ./ ./

RUN npm run build

FROM nginx:stable-alpine as production


COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
