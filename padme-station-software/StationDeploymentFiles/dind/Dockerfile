FROM docker:dind

#Copy the docker deamon configuration with the correct ip ranges and default bridge ip
COPY deamon.json /etc/docker/daemon.json

# Install dnsmasq for DNS forwarding 
# and configure it to listen at 172.31.0.1 (default bridge network)
RUN apk add dnsmasq --no-cache
RUN echo "listen-address=172.31.0.1" > /etc/dnsmasq.conf

#Overwrite entrypoint to start dnsmasq at the beginning
COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]