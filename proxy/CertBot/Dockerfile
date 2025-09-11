FROM nginxproxy/acme-companion as image

#Image used in the prod instance of the main padme ecosystem
#contains additional certificates used for redirects (needed for backwards compatibility)
FROM image as image-with-redirects
COPY ./standalonecerts /app/letsencrypt_user_data