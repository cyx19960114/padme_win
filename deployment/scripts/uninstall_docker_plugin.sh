#!/usr/bin/env bash
#
# Uninstalls a installed docker plugin
# Arguments:
# 1. user@machine : Target machine where the plugin should be installed. Needs to be accessible via ssh by keypairs (without password)
# 2. the plugin name: The name of the plugin to install 
#
ssh $host "docker plugin disable $plugin_name"
ssh $host "docker plugin rm $plugin_name"