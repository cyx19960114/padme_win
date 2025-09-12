#First, build the app
FROM node:18-alpine as build
WORKDIR /workdir

COPY . .

#Perform substitution of the domain target for local deployment
ARG SERVICE_DOMAIN=localhost
ARG PROD_SERVICE_DOMAIN=localhost
ARG TO_REPLACE=src/environments/environment.prod.ts

# Create local environment configuration
RUN echo 'const environment = {' > $TO_REPLACE && \
    echo '  production: true,' >> $TO_REPLACE && \
    echo '  preventLeaveOnFileChanges: true,' >> $TO_REPLACE && \
    echo '  domain: "localhost",' >> $TO_REPLACE && \
    echo '  prodDomain: "localhost",' >> $TO_REPLACE && \
    echo '  apiUrl: "http://localhost:3002",' >> $TO_REPLACE && \
    echo '  defaultSessionId: ""' >> $TO_REPLACE && \
    echo '};' >> $TO_REPLACE && \
    echo 'export { environment };' >> $TO_REPLACE

# Fix the Keycloak providers configuration for local development
ARG PROVIDERS_FILE=src/environments/environment-providers.prod.ts
RUN echo 'import { APP_INITIALIZER, LOCALE_ID } from "@angular/core";' > $PROVIDERS_FILE && \
    echo 'import { KeycloakService } from "keycloak-angular";' >> $PROVIDERS_FILE && \
    echo 'import { environment } from "./environment";' >> $PROVIDERS_FILE && \
    echo '' >> $PROVIDERS_FILE && \
    echo 'function initializeKeycloak(keycloak: KeycloakService) {' >> $PROVIDERS_FILE && \
    echo '  return () =>' >> $PROVIDERS_FILE && \
    echo '    keycloak.init({' >> $PROVIDERS_FILE && \
    echo '      config: {' >> $PROVIDERS_FILE && \
    echo '        url: "http://localhost:8090",' >> $PROVIDERS_FILE && \
    echo '        realm: "pht",' >> $PROVIDERS_FILE && \
    echo '        clientId: "playground"' >> $PROVIDERS_FILE && \
    echo '      },' >> $PROVIDERS_FILE && \
    echo '      initOptions: {' >> $PROVIDERS_FILE && \
    echo '        onLoad: "check-sso",' >> $PROVIDERS_FILE && \
    echo '        silentCheckSsoRedirectUri:' >> $PROVIDERS_FILE && \
    echo '          window.location.origin + "/assets/silent-check-sso.html"' >> $PROVIDERS_FILE && \
    echo '      }' >> $PROVIDERS_FILE && \
    echo '    });' >> $PROVIDERS_FILE && \
    echo '}' >> $PROVIDERS_FILE && \
    echo '' >> $PROVIDERS_FILE && \
    echo 'export const providers = [' >> $PROVIDERS_FILE && \
    echo '  {' >> $PROVIDERS_FILE && \
    echo '    provide: APP_INITIALIZER,' >> $PROVIDERS_FILE && \
    echo '    useFactory: initializeKeycloak,' >> $PROVIDERS_FILE && \
    echo '    multi: true,' >> $PROVIDERS_FILE && \
    echo '    deps: [KeycloakService]' >> $PROVIDERS_FILE && \
    echo '  },' >> $PROVIDERS_FILE && \
    echo '  { provide: LOCALE_ID, useValue: "de-DE"}' >> $PROVIDERS_FILE && \
    echo '];' >> $PROVIDERS_FILE

#Install package and run build
RUN npm install
RUN npm run-script build

#Then copy the results as prod
FROM nginx:alpine as prod
COPY --from=build /workdir/dist/playground-frontend /usr/share/nginx/html

#Custom nginx conf with proper redirects
COPY /conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80