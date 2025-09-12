FROM node:23 AS build-stage
WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . .

# Build arguments for environment variables
ARG FRONTEND_API_URL=http://localhost:8001
ARG FRONTEND_KEYCLOAK_SERVER_URL=http://localhost:8090
ARG FRONTEND_KEYCLOAK_REALM=pht
ARG FRONTEND_KEYCLOAK_CLIENT_ID=monitoring-frontend

# Set environment variables for build
ENV FRONTEND_API_URL=$FRONTEND_API_URL
ENV FRONTEND_KEYCLOAK_SERVER_URL=$FRONTEND_KEYCLOAK_SERVER_URL
ENV FRONTEND_KEYCLOAK_REALM=$FRONTEND_KEYCLOAK_REALM
ENV FRONTEND_KEYCLOAK_CLIENT_ID=$FRONTEND_KEYCLOAK_CLIENT_ID

RUN npm run build

FROM nginx:alpine
COPY --from=build-stage /app/dist/ /usr/share/nginx/html
COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

# Create environment configuration script
RUN echo '#!/bin/sh' > /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'set -e' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'echo "Configuring frontend with environment variables..."' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'echo "API_URL: $FRONTEND_API_URL"' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'echo "KEYCLOAK_URL: $FRONTEND_KEYCLOAK_SERVER_URL"' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    chmod +x /docker-entrypoint.d/30-envsubst-on-templates.sh

EXPOSE 80
