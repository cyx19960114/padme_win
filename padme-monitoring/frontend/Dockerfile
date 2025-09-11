FROM node:23 AS build-stage
WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build-stage /app/dist/ /usr/share/nginx/html
COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
