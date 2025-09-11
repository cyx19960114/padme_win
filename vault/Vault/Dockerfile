FROM hashicorp/vault:latest

# Install OpenSSL
RUN apk update && \
  apk add --no-cache openssl && \
  rm -rf "/var/cache/apk/*"

COPY generate_cert.sh /usr/local/bin/generate_cert.sh
RUN ["chmod", "+x", "/usr/local/bin/generate_cert.sh"]

COPY ./vault.json vault/config/vault.json

ENTRYPOINT ["docker-entrypoint.sh"]