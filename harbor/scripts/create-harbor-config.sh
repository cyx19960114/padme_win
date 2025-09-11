#!/usr/bin/env bash
#
# Arguments:
# 1. The path to the default configuration file
# 2. The contents of the user defined harbor file
#
# 
# 
defaultConfig=$1
userConfig=$2

#Check if default config exists
if [ ! -s "$defaultConfig" ]
then
    printf 'Please provide a default config. Could not find non empty file at %s\n' $defaultConfig
    exit 1
fi

#If a user config is provided, we
#1. Check the version
#2. Merge with default config
if [ -n "$userConfig" ]; then
    userPath="/tmp/user-config.yml"
    resultPath="/tmp/result.yml"
    versionIdentifier="._padme_harbor_cfg_version"

    #Write the user config to file
    printf "User config provided\n"
    echo -e "$userConfig" > "$userPath"

    #Compare versions
    user_version=$(yq $versionIdentifier $userPath)
    default_version=$(yq $versionIdentifier $defaultConfig)
    if [ "$default_version" != "$user_version" ]; then
        printf 'Your user provided configuration did not have the expected version. Expected %s, got %s. Please check the repository for changes and adjust your file if needed\n' $default_version $user_version
        exit 1
    fi

    printf 'The version of the default and user file matches, merging configuration\n'

    # Both exists and the version matches, lets merge and overwrite defaultConfig
    yq eval-all '. as $item ireduce ({}; . * $item )' $defaultConfig $userPath > $resultPath
    mv $resultPath $defaultConfig
else
    printf "No user config provided, taking default config\n"
fi
printf "Processing finished. You can find the resulting config in the CI/CD artefacts\n"