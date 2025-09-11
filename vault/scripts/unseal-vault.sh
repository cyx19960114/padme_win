#!/usr/bin/env bash
# 
# Arguments:
# 1. The target host at which vault should be unsealed
# 2. The target dir at which vault is deployed at the host
# 3. The unseal keys seperated by newlines
#
# Unseals the vault instance at the given location using the provided keys

provide_vault_unseal_portion()
{
    ssh $1 "cd $2 && docker compose exec vault /bin/ash -c 'vault operator unseal -tls-skip-verify $3'"
}

# Split the unseal portions at the new line
readarray potions <<< "$3"

# Provide each potion to vault
for potion in "${potions[@]}"
do
    provide_vault_unseal_portion $1 $2 $potion
done