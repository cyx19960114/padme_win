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
