## PADME Train Creator

This repository contains the code for the PADME Train Creator. See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

The current live version of the Train Creator is accessible [here](https://creator.padme-analytics.de).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Development

This repository supports development containers. For this, you need to perform an initial setup before starting the dev container. Please execute the following steps:

1. Create a file named '.env' in the root of the directory with the following content:

```
VAULT_ROLE_ID=XXXX
VAULT_SECRET_ID=YYYY
```

2. Replace 'XXXX' and 'YYYY' with the corresponding values configured in gitlab for staging instance (see Settings -> CI/CD -> Variables)
3. Start your dev container via VS Code

## Pre-requisites
Before you can deploy Train Creator, the following services need to be setup.
- [Train Depot](https://git.rwth-aachen.de/padme-development/train-depo) (i.e., Gitlab instance)
- [Vault](https://git.rwth-aachen.de/padme-development/vault#train-creator-train-store)
- [Keycloak](https://git.rwth-aachen.de/padme-development/keycloak)

Once the services, are up, you need to complete the following steps:
- Create a new group which holds the `padme-train-depot` and `padme-federated-train-depot` repositories. Users should be added to this group with edit access before they can push trains via Train Creator.
- Create a new client in Keycloak with client protocol `openid-connect` and access type `public`. Make sure the valid redirect URIs point to `https://creator.${YOUR_DOMAIN}/*`. 

## Deployment

To deploy this service, other (dependent) services mentioned above need to be deployed and configured first. See [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you have deployed the dependencies, the following variables need to be set for the deployment of the CS (via gitlab CI/CD variables, as described in the instructions mentioned above):


| Environment Variable       | Description                                                                          | Sample Value                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| KC_REALM                   | Keycloak realm name                                                                  | pht                                                                              |
| KC_URL                     | Keycloak URL                                                                         | https://auth.padme-analytics.de/auth                                             |
| KC_CLIENT_ID               | Keycloak client ID                                                                   | train-creator                                                                    |
| KC_USERINFO_URL            | Keycloak userinfo URL                                                                | https://auth.padme-analytics.de/auth/realms/pht/protocol/openid-connect/userinfo |
| GITLAB_URL                 | Gitlab URL of Train Depot                                                            | https://depot.padme-analytics.de                                                 |
| GITLAB_GROUP_ID            | Gitlab group ID against which provided user credentials are checked to see if member | 39                                                                               |
| GITLAB_STORE_ID            | Gitlab project ID of the Train Depot                                                 | 35                                                                               |
| GITLAB_FEDERATED_STORE_ID  | Gitlab project ID of the Federated Train Depot                                       | 36                                                                               |
| GITLAB_STORE_URL           | Gitlab URL of the Train Depot subfolder                                              | https://depot.padme-analytics.de/padme/padme-train-depot                         |
| GITLAB_FEDERATED_STORE_URL | Gitlab URL of the Federated Train Depot subfolder                                    | https://depot.padme-analytics.de/padme/padme-federated-train-depot               |
| GITLAB_STORE_MAIN_BRANCH   | Gitlab main branch name of the Train Depot                                           | main                                                                             |
| VAULT_URL                  | Vault URL                                                                            | https://vault:8200                                                               |
| VAULT_ROLE_ID              | Vault Role Id                                                                        | Token for Default Vault                                                          |
| VAULT_SECRET_ID            | Vault Secret Id                                                                      | Token for Default Vault                                                          |
| APPLICATION_HOST           | Application Host IP                                                                  | 0.0.0.0                                                                          |
| PORT                       | Application Port                                                                     | 5000      
| SERVICE_DOMAIN | Domain of your application (Might already be set at project level) | padme-analytics.de                                                                        |

Please note some of these configs are tightly related to one another and changing one may affect the others. Like for instance, if `GITLAB_URL` is changed, every related `GITLAB` config may need changing.
