# Train Depot

This repository contains the configuration file that we use to deploy the PADME Train Depot. The Train Depot is a GitLab instance that provides the algorithms to the ecosystem.

See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

## Pre-requisite

The following services need to be deployed before Train Depot can be deployed:

- [Keycloak](https://git.rwth-aachen.de/padme-development/keycloak)

Once keycloak is deployed, you need to create a client for the Train Depot. You can find more details [here](https://docs.gitlab.com/ee/administration/auth/oidc.html#configure-keycloak) on how to configure the client. Once you have the required information, you need to provide it as a custom configuration to the CI/CD pipeline via a variable. This config will be merged with the existing `docker-compose.template.yml`.

You also need to configure the external_url and nginx config for both gitlab and registry, since the services will be behind a reverse proxy.

An example config variable would look like this:

```yaml
# depot_compose_version: 1.0

services:
  gitlab:
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        # Configuration for Reverse Proxy
        external_url 'https://depot.${YOUR_DOMAIN}'
        nginx['listen_port'] = 80
        nginx['listen_https'] = false

        registry_external_url 'https://registry.${YOUR_DOMAIN}'
        registry_nginx['listen_port'] = 80
        registry_nginx['listen_https'] = false

        # Configuration for Keycloak Integration
        gitlab_rails['omniauth_allow_single_sign_on'] = ['openid_connect']
        gitlab_rails['omniauth_providers'] = [
          {
            name: "openid_connect",
            label: "Keycloak", # optional label for login button, defaults to "Openid Connect"
            args: {
              name: "openid_connect",
              scope: ["openid", "profile", "email"],
              response_type: "code",
              issuer:  "https://auth.${YOUR_DOMAIN}/auth/realms/pht",
              client_auth_method: "query",
              discovery: true,
              uid_field: "preferred_username",
              client_options: {
                identifier: "depot.${YOUR_DOMAIN}",
                secret: "<SECRET>",
                redirect_uri: "https://depot.${YOUR_DOMAIN}/users/auth/openid_connect/callback"
              }
            }
          }
        ]
```

## Create Harbor user for Train Depot

After setting up the client, you also need to create a new user in the Keycloak. This user will be used by the depot build pipeline to push images to Harbor. 

- Login to your Keycloak instance with admin.
- Navigate to the "pht" realm.
- Go to "Users" and click "Add user".
- Add the "Username" field and click "Create".
- Click the username in the list and go to "Credentials" tab on top.
- Set a password for this user and make sure temporary password is turned off.
- Save the password in a safe place.

Now that you've created a user for Train Depot, you need to login to the Harbor registry with this user using the OIDC provider option. You need to copy the CLI secret for this user which will be used later in the deployed Train Depot.

- Login to Harbor using "LOGIN VIA OIDC Provider".
- Use the username and password you created earlier.
- Go to your profile on the top right and select "User Profile".
- Copy the "CLI secret" at the bottom and store it somewhere safe.

## Deployment

Once you have the pre-requisites deployed, the following variables need to be set for the deployment of the Depot (via gitlab CI/CD variables).

| Variable                  | Description                                                                                                                                                                                           | Example Value                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| GITLAB_IMAGE              | The image that will be used for the gitlab service                                                                                                                                                    | gitlab/gitlab-ce:15.6.2-ce.0                |
| GITLAB_VOLUME_DIR         | The directory where the gitlab data will be stored                                                                                                                                                    | /srv/gitlab                                 |
| CUSTOM_COMPOSE_CONFIG     | The custom configuration for the gitlab service                                                                                                                                                       | See above                                   |
| DEPLOYMENT_TARGET_DIR     | The directory on the target host where the central service compose file will be stored                                                                                                                | /home/deployment/TrainDepot                 |
| DEPLOYMENT_TARGET_HOST    | The username and host where central service should be deployed to. This needs to be in the format user@host.                                                                                          | deployment@menzel.informatik.rwth-aachen.de |
| DEPLOYMENT_TARGET_SSH_KEY | The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here. | $CENTRALSERVICE_VM_DEPLOYMENT_PRIVATE_KEY   |

## Root Account

Once deployed, you can visit the GitLab URL, and sign in with the username root and the password from the following command (executed on the target host, with the container name being gitlab):

`sudo docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password`

NOTE: The password file will be automatically deleted in the first reconfigure run after 24 hours.

## GitLab Runner

Please follow the instructions [here](https://docs.gitlab.com/runner/install/) to setup a gitlab runner.

## Setting up Repositories

Once the depot gitlab instance is up and running, you have to setup a new group and create two new repositores, `padme-train-depot` and `padme-federated-train-depot` for incremental and federated train storage (of course the name does not really matter). Users can then be added to this group and they can then use the repositories to store their trains and also the train creator and storehouse apps. The repositories also need to configured with a `.gitlab-ci.yml` to run the pipelines which will build and push the new trains to Harbor repository.

## Setting up Environment Variables

Assuming the previous stages were successful, you now have a group with two repositories `padme-train-depot` and `padme-federated-train-depot` for incremental and federated train storage (or the names of your choosing). Now you need to add CI/CD variables to the group. This way these variables will be inherited to all repositories in the group and avoids repetition. Following environment variables need to be added `HARBOR_REGISTRY`, `HARBOR_REGISTRY_USER`, and `HARBOR_REGISTRY_PASSWORD`.

- Login to Train Depot with admin.
- On the left go to "Groups" and click the group you created earlier.
- Go to "Settings" on the left sidebar and click "CI/CD".
- In the "Variables" option click "Expand" -> "Add variable".
- Uncheck the "Protect variable" option for each variable.
- Add each variable above one by one.
- **IMPORTANT**: For the variable `HARBOR_REGISTRY_PASSWORD`, paste the "CLI Secret" you copied in the previous steps.

## Using Object Storage

If you want to use Object Storage (like S3 buckets) for storing the Gitlab data, you can configure it by adding the additional config to the `CUSTOM_COMPOSE_CONFIG` variable.

For example an S3 object storage config would look like this:

```yaml
version: "3.6"
services:
  gitlab:
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        # Consolidated object storage configuration
        gitlab_rails['object_store']['enabled'] = true
        gitlab_rails['object_store']['proxy_download'] = true
        gitlab_rails['object_store']['connection'] = {
          'provider' => 'AWS',
          'region' => 'us-east-1',
          'endpoint' => '<S3_ENDPOINT>',
          'aws_access_key_id' => '<AWS_ACCESS_KEY_ID>',
          'aws_secret_access_key' => '<AWS_SECRET_ACCESS_KEY>'
        }
        # OPTIONAL: The following lines are only needed if server side encryption is required
        gitlab_rails['object_store']['storage_options'] = {
          'server_side_encryption' => '<AES256 or aws:kms>',
          'server_side_encryption_kms_key_id' => '<arn:aws:kms:xxx>'
        }
        gitlab_rails['object_store']['objects']['artifacts']['bucket'] = 'gitlab-artifacts'
        gitlab_rails['object_store']['objects']['external_diffs']['bucket'] = 'gitlab-mr-diffs'
        gitlab_rails['object_store']['objects']['lfs']['bucket'] = 'gitlab-lfs'
        gitlab_rails['object_store']['objects']['uploads']['bucket'] = 'gitlab-uploads'
        gitlab_rails['object_store']['objects']['packages']['bucket'] = 'gitlab-packages'
        gitlab_rails['object_store']['objects']['dependency_proxy']['bucket'] = 'gitlab-dependency-proxy'
        gitlab_rails['object_store']['objects']['terraform_state']['bucket'] = 'gitlab-terraform-state'
        gitlab_rails['object_store']['objects']['ci_secure_files']['bucket'] = 'gitlab-ci-secure-files'
        gitlab_rails['object_store']['objects']['pages']['bucket'] = 'gitlab-pages'
```

You can find further information [here](https://docs.gitlab.com/ee/administration/object_storage.html).

PS: The buckets need to be created beforehand, for example `gitlab-artifacts`, `gitlab-mr-diffs` etc., otherwise the Gitlab CI/CD pipelines will fail. You will not get any errors during the deployment of the Depot, but the pipelines in the Depot will fail.
