#!/usr/bin/env bash
#
# Arguments:
# 1. user@machine: Target machine where the fix should be run
# 2. name of the network to fix
#
# Runs a fix that is needed if a compose file creates a container in a swarm network for the first time.
# Due to the design of docker swarm, swarm networks are only visible to worker nodes when there is a
# container running in this network. When using docker-compose, this leads to an error that the provided
# external network does not exist (while it does).
# This issue was supposibly fixed in the past but seems to persit in our setup.
# See this github issue: https://github.com/docker/compose/issues/8996
#

host=$1
if [ -z "$host" ] #if no argument is given
then
    printf 'Please specify host name for the fix \n'
    exit 1
fi
network=$2
if [ -z "$network" ] #if no argument is given
then
    printf 'Please specify network name for the fix \n'
    exit 1
fi

ssh $host "docker run -d --rm --net $network alpine sleep 60"