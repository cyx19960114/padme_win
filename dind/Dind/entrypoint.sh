#!/bin/ash
dnsmasq
#Add the nameserver to the resolver config so this one is used
echo "nameserver 172.31.0.1" >> /etc/resolv.conf
echo "dns mask started"
#Start initial entrypoint
dockerd-entrypoint.sh "$@"