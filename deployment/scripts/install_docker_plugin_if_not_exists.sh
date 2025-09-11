#!/usr/bin/env bash
#
# Installs a docker plugin on the target machine if it does not already exist
# Arguments:
# 1. user@machine : Target machine where the plugin should be installed. Needs to be accessible via ssh by keypairs (without password)
# 2. the plugin name: The name of the plugin to install 
# 3... : any additional argument will be provided as argument to the plugin installation
# 
host=$1
plugin_name=$2

#Check if installed 
plugin_exists=$(ssh $host "docker plugin ls | grep \" $plugin_name \"")
if [ ! -z "$plugin_exists" ] #if $plugin_exists is a non zero string -> It is already installed, exit
then
    printf 'Plugin %s is already installed in target system %s\n' "$plugin_name"
    exit 0
fi

#Install 
shift 2 #(shift removes the first two arguments from $@)
if [ $# -eq 0 ] # Check if arguments are given
then
    ssh $host "docker plugin install --grant-all-permissions $plugin_name"
else
    echo "Executing with extra arguments \"$@\""
    ssh $host "docker plugin install --grant-all-permissions $plugin_name $@"
fi