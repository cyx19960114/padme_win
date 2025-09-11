## Harbor

This repository provides the deployment configurations for [Harbor](https://goharbor.io/), the container registry used in the PADME ecosystem. While there are many registries available (such as the [official one by Docker](https://hub.docker.com/_/registry)), Harbor offers additional features that are used in our ecosystem. For example, it provides integration with OIDC providers, such as Keycloak, [Webhooks for event-based processing](https://goharbor.io/docs/1.10/working-with-projects/project-configuration/configure-webhooks/), and support for [Cosign](https://github.com/sigstore/cosign), an container image signing solution.

See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Deployment

To deploy this service, other (dependent) services need to be deployed first. See [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you have deployed the dependencies, proceed with the following steps to deploy your harbor instance.

Harbor and the corresponding deployment differs from the other services in the ecosystem because the source code and container images are provided by a third-party, namely Harbor itself. Therefore, Harbor also has its own configuration, which is stored in a 'harbor.yml' file. Harbor uses this configuration file to configure all it services. Moreover, it will automatically generate a docker-compose file during the deployment that contains those configurations.

This repository provides a default 'harbor.template.yml', which configures Harbor with sensible defaults. For example, all harbor data will be stored at ```${DEPLOYMENT_TARGET_DIR}/data```. Moreover, we provide a ```docker-compose.override.yml```file, which adjusts the generated docker-compose file from Harbor to our ecosystem. For example, we will append the necessary configurations for our reverse proxy setup.

While we provide sensible defaults, you can still adjust the harbor configuration to your needs before the deployment. For example, you can configure the [harbor storage backend e.g. to S3](https://goharbor.io/docs/1.10/install-config/configure-yml-file/). This adjustment is done by providing your own harbor configuration via the ```CUSTOM_HARBOR_CONFIG``` GitLab CI/CD variable. This configuration will automatically be merged with our default configuration before the deployment. Consequently, you configuration should only contain those parts that need to be added or changed. Any new keys defined in your configuration will be added to the resulting configuration. Any value you define for existing keys will be overwritten. Take the following example.

Suppose the following content is provided in via the ```CUSTOM_HARBOR_CONFIG``` variable:


```yaml
_padme_harbor_cfg_version: 1.0

#Use s3 storage and not the file system
storage_service:
  s3:
    accesskey: XXXXXXXX
    secretkey: XXXXXXXX
    region: us-east-1
    regionendpoint: XXXXXXXX
    bucket: XXXXXXXX

jobservice:
  # Maximum number of job workers in job service
  max_job_workers: 11
```

This will result in a configuration that configures Harbor to use S3 as a storage backend instead of storing files in a local file mount. Moreover, the maximum number of workers for the jobservice would be set to 11 (instead of the default 10, which is used in our configuration). If you want to see the merged ```harbor.yml``` file that will be used for the deployment, you can run the first CI/CD job (e.g. only define the ```CUSTOM_HARBOR_CONFIG``` variable and leave out all other required variables, which will lead to failure in the second job without any deployment). This job will provide the file as an artefact and does not yet perform any deployments. Note that the artefact will not have any environment variable substitutions performed.

As you may have noticed, the configuration provided above contains a key called ```_padme_harbor_cfg_version```, which is not documented in the [harbor configuration documentation](https://goharbor.io/docs/1.10/install-config/configure-yml-file/). When you define a custom configuration, the version number provided in this key is compared to the version given in the default template. If those versions do not match, an error will be created during the CI/CD deployment. This mechanism is introduced to managed any updates we might perform to the default template. If there is a breaking change, we will increase the version number. You can then inspect the configuration change to see if this is still suitable for your environment. If not, you can adjust your custom configuration. In any case you need to adjust your custom configuration to match the version number in the template for the deployment to succeed.

Given the information above on how to adjust your harbor configuration if needed, please define the following GitLab CI/CD variables for the harbor deployment:

| Variable Name             | Description                                                                                                                                                                                           | Example value                       |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| DEPLOYMENT_TARGET_DIR     | The directory on the target host where the harbor compose file will be stored. We recommend the provide exemplary value                                                                                | /home/deployment/harbor/             |
| DEPLOYMENT_TARGET_HOST    | The username and host where harbor should be deployed to. This needs to be in the format user@host                                                                                                      | deployment@TARGET_MACHINE_HOST_NAME |
| DEPLOYMENT_TARGET_SSH_KEY | The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here. | MACHINE_NAME_PRIVATE_KEY            |
| HARBOR_ADMIN_PASSWORD | The password used for the ```admin``` user in harbor. This is needed for further configurations | E3qcZYPHizoSKsyycmDX39JEU |
| HARBOR_DATABASE_PASSWORD | The password that should be used for the database created for harbor management data  | jLMyXHkM8EEvv5PZ8UQN4zckU |
| CUSTOM_HARBOR_CONFIG | The custom harbor configuration. The contents of this variable need to be valid yml. See instructions above for details | See example above |

Afterward execute the CI/CD pipeline to finish the deployment. After a short while you should be able to navigate to [https://repository.\$YOUR_DOMAIN](https://repository.\$YOUR_DOMAIN) and login as ```admin``` with the credentials from the CI/CD variable above.

Then proceed with the following, manual configurations to setup your harbor instance.

## Setup

To finish the harbor setup, we need to perform the following manual steps.

### Configure Keycloak login

To log users into harbor, we configure harbor to allow login via Keycloak. Please perform the following steps:

1. Navigate to [https://repository.\$YOUR_DOMAIN](https://repository.\$YOUR_DOMAIN) and login as administrator
2. Under "Administration" navigate to "Configuration". Then select the  "Authentication" tab
3. Change the "Auth Mode" dropdown to "OICD". Keep this tab open and proceed in Keycloak as follows

4. Navigate to [https://auth.\$YOUR_DOMAIN](https://auth.\$YOUR_DOMAIN), login as the Keycloak administrator.
5. Select the 'pht' realm, then on the left under "Configure" navigate to "Clients"
6. Select "Create" in the upper right corner.
7. In harbor, after selecting "OICD" there should be a redirect uri shown at the body. Copy this
8. Enter the following information into the Keycloak client creation page:

Client ID: harbor

Client Protocol: openid-connect

Root URL: The copied redirect uri from the harbor page

9. Click "Save" to persist the client.
10. In the client configuration page shown afterward, change the "Access Type" from "public" to "confidential"
11. Open the "Credentials" tab and copy the secret. Then proceed in harbor as follows

12. Enter the following configuration (paste the secret from Keycloak into 'OIDC Client Secret', "YOUR_DOMAIN" needs to be adjusted to the domain of your ecosystem).

![](/img/harbor_auth_config.png)

13. Click on "Test OIDC server", then on "Save" if the connection could be established

Now you should be able to log-into harbor with Keycloak users.

### More configuration on Keycloak

#### Add the `harbor_custom_email` Protocol Mapper

1. Navigate to [https://auth.\$YOUR_DOMAIN](https://auth.\$YOUR_DOMAIN), login as the Keycloak administrator.
2. Select the 'pht' realm, then on the left under "Configure" navigate to "Clients", and select the "harbor" client.
3. Navigate to the "Client Scopes" section, and choose `harbor-dedicated`.
4. Click "Add mapper" to add a new mapper.
5. Mapper Type: `User Attribute` or `User Property` to map the `username` to the `email` claim.
```json
  "introspection.token.claim": "true",
  "userinfo.token.claim": "true",
  "user.attribute": "username",
  "id.token.claim": "true",
  "lightweight.claim": "false",
  "access.token.claim": "true",
  "claim.name": "email",
  "jsonType.label": "String"
```

6. Click "Save" to add the protocol mapper.

#### Set Built-In Email Scope to Optional

1. Navigate to [https://auth.\$YOUR_DOMAIN](https://auth.\$YOUR_DOMAIN), login as the Keycloak administrator.
2. Select the 'pht' realm, then on the left under "Configure" navigate to "Clients", and select the "harbor" client.
3. Locate the built-in client scope for email.
4. Set the "Assigned type" to "Optional".

### Configure `system_user`
1. Navigate to [https://repository.\$YOUR_DOMAIN](https://repository.\$YOUR_DOMAIN) and login with `system_user` via OIDC, and log out.
2. Log in again as the Harbor admin without OIDC.
3. Navigate to "Administration" and then to "Users".
4. Select the system_user from the user list.
5. Click on "SET AS ADMIN" button.

### Get the CLI Secret for the `system_user` (this is needed when deploying other services)
1. Navigate to [https://repository.\$YOUR_DOMAIN](https://repository.\$YOUR_DOMAIN) and login as `system_user` via OIDC.
2. Click on the user icon in the upper right corner and select "User Profile".
3. Click the clipboard icon to copy the CLI secret associated with the `system_user`.