#!/bin/bash

# Setup the ssh-agent configuration
# ssh-agent -s prints out the correct environment variable bindings for the current agent
# eval reads this in as a program, which results in those bindings being set as environment variables.
# Without this, we will get a connection error upon every ssh command
echo "Starting SSH Agent"
eval $(ssh-agent -s)
echo "SSH Agent started"

#Default entrypoint of the ubuntu image
exec "$@"