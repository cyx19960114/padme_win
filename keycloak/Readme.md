# PADME Keycloak

This repository contains the setup for Keycloak, the IAM provider for the PADME ecosystem. See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Deployment

To deploy this service, first view the [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you are familiar with the procedure, please define the following CI/CD variables in your mirrored repository:

| Variable Name             | Description                                                                                                                                                                                           | Example value                       |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| DEPLOYMENT_TARGET_DIR     | The directory on the target host where the Keycloak compose file will be stored. We recommend the provide the exemplary value                                                                                | /home/deployment/Keycloak/             |
| DEPLOYMENT_TARGET_HOST    | The username and host where Keycloak should be deployed to. This needs to be in the format user@host                                                                                                      | deployment@TARGET_MACHINE_HOST_NAME |
| DEPLOYMENT_TARGET_SSH_KEY | The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here. | MACHINE_NAME_PRIVATE_KEY            | 
| KEYCLOAK_POSTGRES_PASSWORD | The password that should be used for the PostgreSQL database that is provided for the Keycloak data | rvkvnEjbC0sXyl7nsjJvHVpZC |

Afterward, execute the CI/CD pipeline to finish the deployment. Then execute the following steps to setup the instance:

## Setup

In order to use and configure Keycloak, we need to create a Keycloak admin user and a new realm. Proceed with the following steps to create the user:

After the deployment, wait a short while (max. 5 minutes) for the certificate for Keycloak to be created. You should then be able to navigate to [https://auth.$YOUR_DOMAIN](https://auth.$YOUR_DOMAIN). If the website shows a SSL error you either need to wait a bit longer or investigate the issue by viewing the logs of the Let's Encrypt bot from the Proxy setup. If the website is visible, proceed as follows to create a Keycloak admin user and realm.

1. Get an interactive session in the Keycloak container

```
docker exec keycloak-keycloak-1 bin/bash
```

2. Create an admin user

```
/opt/jboss/keycloak/bin/add-user-keycloak.sh -u <USERNAME> -p <PASSWORD>
```
(Replace \<USERNAME\> and \<PASSWORD\> with the desired values)

**It is very important to remember those credentials. Those will be needed for every Keycloak related setup in the future**

3. Create a new realm

Navigate to the Keycloak UI at [https://auth.$YOUR_DOMAIN](https://auth.$YOUR_DOMAIN).

Click the panel "Administration Console" on the left side. Then authenticate with the credentials you choose in Step 2.

On the top left click on "Master", then choose "Add Realm".

The name of the realm should be:

```
pht
``

You are now finished with the minimum required Keycloak setup. Every service that uses and interacts with Keycloak needs its own corresponding configuration. Therefore, we will describe the Keycloak setup for each service at the respective section describing the service deployment. See [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). 