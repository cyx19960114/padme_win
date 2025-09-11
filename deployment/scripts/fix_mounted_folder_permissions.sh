#!/usr/bin/env bash
#
# Arguments:
# 1. user@machine : Target machine where the fix should be executed. Needs to be accessible via ssh by keypairs (without password)
# 2. Path to the parent of the folder/file that should be fixed. This path needs to be absolute.
# 3. The name of the folder/file that should be fixed. This should be given as a relative path in the contenxt of argument 2
# 4. The id of the user that the permissions of argument1/argument2 should be updated too. !! This does not update the folder permissions, only the owner!!
#
host=$1
if [ -z "$host" ] #if no argument is given
then
    printf 'Please specify a target user and machine \n'
    exit 1
fi
path=$2
if [ -z "$path" ] #if no argument is given
then
    printf 'Please specify a absolut path that points to the parent folder of the folder/file that should be updated. \n'
    exit 1
fi
element=$3
if [ -z "$element" ] #if no argument is given
then
    printf 'Please specify file/folder name for the target \n'
    exit 1
fi
id=$4
if [ -z "$id" ] #if no argument is given
then
    printf 'Please specify an user id that should be user for the permission update \n'
    exit 1
fi

printf "Changing owner of %s/%s to be user with id %s\n" $path $element $id 
#Change only the owner, the group needs to stay as is such that
#Containers which mount this path can also read the contents
#(Containers often run as root)
#We use a trick here: If the target was created by a container it is often only accessible by root.
#We can therefore not change it with the deployment user because this used is not a member of sudo/root.
#However: We can mount the path to a container and update the permissions as the containers root user
ssh $host "docker run --rm -v $path:$path alpine:latest /bin/ash -c \"chown $id -R $path/$element\""