#First, build the app
FROM node:18-alpine as build
WORKDIR /workdir

COPY . .

#Perform substitution of the domain target
ARG SERVICE_DOMAIN
ARG PROD_SERVICE_DOMAIN
ARG TO_REPLACE=src/environments/environment.prod.ts
#We cannot let envsubst overwrite the file directly since cat and envsubst run simultaneously
RUN apk add gettext && cat $TO_REPLACE | envsubst > tmp.ts && mv tmp.ts $TO_REPLACE

#Install package and run build
RUN npm install
RUN npm run-script build

#Then copy the results as prod
FROM nginx:alpine as prod
COPY --from=build /workdir/dist/playground-frontend /usr/share/nginx/html

#Custom nginx conf with proper redirects
COPY /conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80