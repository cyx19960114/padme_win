#!/bin/sh
# parts taken from zsh installation script published under MIT license
# https://github.com/ohmyzsh/ohmyzsh/blob/master/tools/install.sh

#default configurations
PADME=${PADME:-~/.PADME}
REPO=${REPO:-https://github.com/LaurenzNeumann/TestInstallPHT.git}


SUDO_WRAPPER=

setup_color() {
    RED=$(printf '\033[31m')
    GREEN=$(printf '\033[32m')
    YELLOW=$(printf '\033[33m')
    BLUE=$(printf '\033[34m')
    BOLD=$(printf '\033[1m')
    RESET=$(printf '\033[m')
}

command_exists() {
  command -v "$@" >/dev/null 2>&1
}

fmt_error() {
  printf '%sError: %s%s\n' "$BOLD$RED" "$*" "$RESET" >&2
}

up() {
    LOCATION=${1:-${PADME}}
    cd $LOCATION
    if ! [ -d "$LOCATION" ]; then
        echo "$BOLD Installation folder $PADME not found.$RESET"
        exit 1
    fi
    # subshell exec
    $SUDO_WRAPPER docker-compose up -d || {
        fmt_error "Could not start docker services. Maybe you have insufficient permissions?"
        exit 1
    }
}

stop() {
    LOCATION=${1:-${PADME}}
    cd $LOCATION
    if ! [ -d "$LOCATION" ]; then
        echo "$BOLD Installation folder $PADME not found.$RESET"
        exit 1
    fi
    # subshell exec
    $SUDO_WRAPPER docker-compose stop || {
        fmt_error "Could not stop docker services. Maybe you have insufficient permissions?"
        exit 1
    }
}

install() {
    LOCATION=${1:-${PADME}}

    if [ -d "$LOCATION" ]; then
        echo "$BOLD$YELLOW Installation folder $PADME does already exist. Please specify a different folder for installation.$RESET"
        exit 1
    fi
    echo "Download PADME installation files..."
    git clone "$REPO" "$LOCATION" || {
        fmt_error "Cloning failed."
        exit 1
    }
    echo "$GREEN PADME installation files downloaded.$RESET"
    echo "Building images..."
    cd "$LOCATION"
    $SUDO_WRAPPER docker-compose build || {
        fmt_error "Building not possible. Maybe you have insufficient rights to execute docker-compose?$RESET"
        exit 1
    }
    echo "Pulling images..."
    $SUDO_WRAPPER docker-compose pull || {
        fmt_error "Pulling not possible. Maybe you have insufficient rights to execute docker-compose?"
        echo "$YELLOW Warning: undefined state of software. Please pull the new image by hand or execute '$0 update'.$RESET"
        exit 1
    }
    echo "$GREEN Images pulled. $RESET"
    echo "$GREEN PADME installed. Run '$0 start' to start the software."
    echo "$GRENN After that continue with the setup on $BLUE http://localhost:3030$RESET"

}

update() {
    LOCATION=${1:-${PADME}}
    cd "$LOCATION"
    if ! [ -d "$LOCATION" ]; then
        fmt_error "Installation Location $LOCATION not found."
        exit 1
    fi
    # set auto stash
    resetAutoStash=$(git config --bool rebase.autoStash 2>/dev/null)
    git config rebase.autoStash true
    lastCommit=$(git rev-parse HEAD)
    git pull --rebase --stat origin main || {
        fmt_error "Pulling failed."
        exit 1
    }
    #restore autostash config
    git config rebase.autoStash "$resetAutoStash"
    newCommit=$(git rev-parse HEAD)
    if [ "$lastCommit" == "$newCommit" ]; then
        echo "Compose already up to date."
        
    else
        echo "Compose file updated."
    fi
    # stop images
    echo "Stop container..."
    stop
    echo "Build changed images..."
    $SUDO_WRAPPER docker-compose build || {
        fmt_error "Building not possible. Maybe you have insufficient rights to execute docker-compose?$RESET"
        exit 1
    }
    echo "Pull changed images..."
    $SUDO_WRAPPER docker-compose pull || {
        fmt_error "Pulling not possible. Maybe you have insufficient rights to execute docker-compose?"
        echo "$YELLOW Warning: undefined state of software. Please pull the new image by hand or restart the update process.$RESET"
        exit 1
    }
    echo "Start container..."
    up
    echo "$GREEN Update successful.$RESET"
}

display_help() {
    cat <<EOF
PADME Installation Script.
usage: padmetools [--root] command
Commands available:

install - Clone the PADME installation repo and pull the docker images
update - Update the local PADME files to the newest version available and pull any new images
start - Start the PADME installation (and apply any updated images)
stop - Stop the PADME installation

This script helps you installing and maintaining your PADME installation.
The location of your padme installation is normally ~/.PADME but can be overwritten by setting
the PADME environment variable. If you install PADME into a different location, you need to set this variable accordingly before invoking this script.
Also note that executing this script as sudo changes the default installation into the home location of root.
To counteract that, you can either set the environment variable, or call the script with the --root flag which tries to execute
the docker commands with sudo inside the script.

THIS SCRIPT IS TO USE WITHOUT ANY WARRANTY AND ON YOUR OWN RISK.
EOF
}

command_exists git || {
    fmt_error "git is needed for this script but not installed"
}

command_exists docker-compose || {
    fmt_error "docker-compose is needed for this script but not installed"
}

if [ `uname` != Linux ]; then
    fmt_error "Only Linux is currently supported by this script."
fi

setup_color

# parse options and command
while [ $# -gt 0 ]; do
    case $1 in
        --root) SUDO_WRAPPER=sudo; echo "$YELLOW Some commands will be tried to be executed with root privileges.$RESET";;
        *) COMMAND=$1;;
    esac
    shift
done

case $COMMAND in
    help)
        display_help
        ;;
    install)
        install
        ;;
    update)
        update
        ;;
    start)
        up
        ;;
    stop)
        stop
        ;;
    *)
        echo "Unknown command"
        display_help
esac

