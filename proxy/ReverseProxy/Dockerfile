#Base image used for staging, only contains the essntial configuration
FROM nginxproxy/nginx-proxy as image

#Create configuration file to read configuration from new directory conf-pht.d.
#This is needed because conf.d is mounted as a volume.
#This means any changes made to conf.d in this image after the mount will not take effect
#Thefore: Create our own folder which is not mounted
RUN echo "include /etc/nginx/conf-pht.d/*.conf;" > /etc/nginx/conf.d/pht.conf

#Copy configuration files
COPY ./increaseRequestSize.conf  /etc/nginx/conf-pht.d/increaseRequestSize.conf
COPY ./timeout.conf  /etc/nginx/conf-pht.d/timeout.conf

#Image used in the prod instance in the main PADME environment
#uses the redirects for old domains
FROM image as image-with-redirects
COPY ./redirect.conf  /etc/nginx/conf-pht.d/redirect.conf