#!/usr/bin/env bash
# 
# Arguments:
# 1. the source file that should be sbustituted as a file name or path
# 2. The target file name or path where the result should be written to
#
# Substitutes environment variables in the given file (first argument) and writes the result to a file
# named according to the second argument
# If some environment variables cannot be resolved, this script will fail

# Methods
check_for_unresolved_vars()
{
    # Iterate the list of variables, check if one is undefined
    rc=0
    while read v
    do
            if [[ ! "${!v}" ]]
            then
                    printf 'ERROR: unresolved variable in substitution source %s\n' "$v"
                    rc=1
            fi
    done

    return $rc
}

fail_if_undefined_vars_exist()
{
    #envsubst - v returns a list of all environment variables
    #We check if all of those are defined
    envsubst -v "$1" | check_for_unresolved_vars
    if [ $? -ne 0 ];
        then exit 1;
    fi;
}

# Entrypoint

# Check if source file exists
if [ ! -f "$1" ]
then
    printf 'Could not find the file %s' "$1"
    exit 1
fi

# Read in the source and target
source="$(cat $1)"
target=$2

# First, check if any of the variables we want to replace is not defined
fail_if_undefined_vars_exist "$source"
# Then do the substitution and store it in the target file
echo "$source" | envsubst > $target