#!/usr/bin/env bash
#
# Arguments:
# 1. The path to the default compose file
# 2. The contents of the user defined custom compose file
#
# 
# 
defaultCompose=$1
customCompose=$2

#Check if default compose exists
if [ ! -s "$defaultCompose" ]
then
    printf 'Please provide a default compose file. Could not find non empty file at %s\n' $defaultCompose
    exit 1
fi

#If a custom compose is provided, we
#1. Check the version
#2. Merge with default compose
if [ -n "$customCompose" ]; then
    customPath="/tmp/custom-compose.yml"
    resultPath="/tmp/result.yml"

    #Write the custom compose to file
    printf "Custom compose provided\n"
    echo -e "$customCompose" > "$customPath"

    #Compare versions, the versisons are at the top of the file as a comment like: # cs_compose_version: 1.0
    custom_version=$(yq 'head_comment' $customPath | head -n 1 | sed 's/ //g')
    default_version=$(yq 'head_comment' $defaultCompose | head -n 1 | sed 's/ //g')
    if [ "$default_version" != "$custom_version" ]; then
        printf 'Your custom compose file did not have the expected version. Expected %s, got %s. Please check the repository for changes and adjust your file if needed\n' $default_version $custom_version
        exit 1
    fi

    printf 'The version of the default and custom compose file matches, merging compose files\n'

    # Both exists and the version matches, lets merge and overwrite defaultCompose
    yq eval-all '. as $item ireduce ({}; . * $item )' $defaultCompose $customPath > $resultPath
    mv $resultPath $defaultCompose
else
    printf "No custom compose file provided, taking default compose file\n"
fi
printf "Processing finished. You can find the resulting compose file in the CI/CD artifacts\n"