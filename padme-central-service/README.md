# PADME Central Service

This repository contains the code for the PADME Central Service (CS). See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Pre-requisites

Before you can deploy the CS, you need to have the following services available.

- [Vault](https://git.rwth-aachen.de/padme-development/vault)
- [Keycloak](https://git.rwth-aachen.de/padme-development/keycloak)
- [Harbor](https://git.rwth-aachen.de/padme-development/harbor)
- SMTP Mail Server
- Slack (Optional)

Documentation on how these services can be deployed is available in their respective repositories.

## Deployment

To deploy this service, other (dependent) services need to be deployed first. See [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you have deployed the dependencies, the following variables need to be set for the deployment of the CS (via gitlab CI/CD variables, as described in the instructions mentioned above):

<table>
<tr>
<th>ENV Var</th>
<th>Description</th>
<th>Example Value</th>
</tr>
<tr>
<td>CENTRAL_SERVICE_AUTH_SERVER_ADMIN_PASSWORD</td>
<td>Admin account password for Auth (Keycloak) Server.</td>
<td>Ex: TOTOCI6JxWolffcdTCAMGnw</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_AUTH_SERVER_ADMIN_USERNAME</td>
<td>Admin account username for the Auth (Keycloak) Server.</td>
<td>Ex: pht_keycloak_admin</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_HARBOR_ADMIN_PASSWORD</td>
<td>Admin account password for Harbor.</td>
<td>Ex: VOWLES6JxBeShovlinTCYMKnw</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_HARBOR_ADMIN_USER</td>
<td>Admin account username for Harbor. This account will be used to create new projects and repositories in harbor required during train execution.</td>
<td>Ex: harbor_admin</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_HARBOR_CLI_SECRET</td>
<td>CLI secret of the above admin user in Harbor. This can be obtained from the user profile.</td>
<td>Ex: aZ20dbmC6pGeor637jXhCGhWlewIs44KeP</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_HARBOR_WEBHOOK_SECRET</td>
<td>Webhook secret for the projects, used to authenticate incoming webhooks.</td>
<td>Ex: jaliSsOnCI6JxElLioTcdTCYMKnw</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_HOST</td>
<td>Mail server host address. We need mail server to send emails with env configs when onboarding new stations.</td>
<td>Ex: smarthost.rwth-aachen.de</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_PASSWORD</td>
<td>Mail server password if using authenticated hosts, empty otherwise.</td>
<td>Ex: "" or MailPassword</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_PORT</td>
<td>Mail server host port.</td>
<td>Ex: 25</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_USER</td>
<td>Mail server user if using authenticated hosts, empty otherwise.</td>
<td>Ex: "" or MailUser</td>
</tr>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_USE_TLS</td>
<td>True if SMTPS.</td>
<td>Ex: false</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MAIL_VERIFY_TLS</td>
<td>True if we want to reject any unauthorized connection.</td>
<td>Ex: false</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MINIO_PASSWORD</td>
<td>Password for the embedded minio service.</td>
<td>Ex: LeC16erc5ain5FeRraRiSF23</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_MINIO_USER</td>
<td>Username for the embedded minio service.</td>
<td>Ex: centralservice</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_S3_PORT</td>
<td>Port for S3 Storage.</td>
<td>Ex: 443. Use 9000 if using embedded MinIO service.</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_S3_ENDPOINT</td>
<td>Hostname of S3 Service.</td>
<td>Ex: play.min.io. Use minio if using embedded MinIO service.</td>
</tr>
<tr>
<tr>
<td>CENTRAL_SERVICE_S3_USE_SSL</td>
<td>Set to true to enable secure (HTTPS) access.</td>
<td>Ex: true. Use false if using embedded MinIO service.</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_S3_ACCESS_KEY</td>
<td>Access key (user ID) of an account in the S3 service.</td>
<td>Ex: ABCDE. Reuse $CENTRAL_SERVICE_MINIO_USER if using embedded MinIO service.</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_S3_SECRET_KEY</td>
<td>Secret key (password) of an account in the S3 service.</td>
<td>Ex: pAssKey. Reuse $CENTRAL_SERVICE_MINIO_PASSWORD if using embedded MinIO service.</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_POSTGRES_PASSWORD</td>
<td>Password for the embedded Postgres DB.</td>
<td>Ex: Mcl604NoRrIsndP81sTri</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_SLACK_BOT_TOKEN</td>
<td>Slack bot token for sending slack messages.</td>
<td>Ex: xoxb-987554285398-5582403792144-cLb0aLonNs0jsEpStRo18MyM</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_SLACK_CHANNEL_ID</td>
<td>Slack channel id slack messages will be sent.</td>
<td>Ex: padme_cs_bot_channel</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_SLACK_SIGNING_SECRET</td>
<td>Slack signing secret for slack bot.</td>
<td>Ex: c6c64rb19255cde19bef1d5cw14sf238</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_STATION_REGISTRY_JWT_SECRET</td>
<td>JWT Secret for authenticating with the Station Registry.</td>
<td>Ex: HaMi1t0NATeuMaX33Tfv</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_VAULT_ROLE_ID</td>
<td>Role ID for Central Service in the Vault.</td>
<td>Ex: 9max330aa-859b-19cd-745a-197002c4d28c</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_VAULT_SECRET_ID</td>
<td>Secret ID for Central Service in the Vault.</td>
<td>Ex: b6VeTtel5-aa6d-02ef-8c88-ee7b338b2272</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_METADATA_STATION_IRI_PREFIX</td>
<td>Prefix IRI for the metadata provider</td>
<td>Ex: "https://metadata.padme-analytics.de/entities/stations/"</td>
</tr>
<tr>
<td>CENTRAL_SERVICE_STATION_REGISTRY_ADDRESS</td>
<td>Station Registry Base URL</td>
<td>Ex: station-registry.de</td>
</tr>
<tr>
<tr>
<td>CENTRAL_SERVICE_STATION_REGISTRY_API_ADDRESS</td>
<td>Station Registry API Endpoint</td>
<td>Ex: https://station-registry.de/api</td>
</tr>
<tr>
<td>DEPLOYMENT_TARGET_DIR</td>
<td>The directory on the target host where the central service compose file will be stored. We recommend the provide exemplary value.</td>
<td>Ex: /home/deployment/CentralService</td>
</tr>
<tr>
<td>DEPLOYMENT_TARGET_HOST</td>
<td>The username and host where central service should be deployed to. This needs to be in the format user@host.</td>
<td>Ex: deployment@menzel.informatik.rwth-aachen.de</td>
</tr>
<tr>
<td>DEPLOYMENT_TARGET_SSH_KEY</td>
<td>The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here.</td>
<td>$CENTRALSERVICE_VM_DEPLOYMENT_PRIVATE_KEY</td>
</tr>
<tr>
<td>MAIL_FROM_ADDRESS</td>
<td>The email address which will be used as the sender address for emails from central service. If you took the recommendation in our guide you can use the group-level variable $MAIL_FROM_ADDRESS.</td>
<td>Ex: padme-noreply@rwth-aachen.de</td>
</tr>
<tr>
<td>MAIL_REPLY_TO_ADDRESS</td>
<td>The email address which users may contact for queries. If you took the recommendation in our guide you can use the group-level variable $MAIL_REPLY_TO_ADDRESS.</td>
<td>Ex: pht@dbis.rwth-aachen.de</td>
</tr>
<tr>
<td>METADATA_STORE_REGISTRY_KEY</td>
<td>The secret used to identify as a central service at the metadata store. If you took the recommendation in our guide you can use the group-level variable $METADATA_STORE_REGISTRY_KEY.</td>
<td>Ex: 9cbDmofnhymessi10VrE8WCR7jq</td>
</tr>
<tr>
<td>CUSTOM_COMPOSE_CONFIG</td>
<td>If you would like to add any additional custom config to the docker compose file, you may provide it in this variable. Otherwise, no need to set this variable. If you set the variable, its configuration will automatically be merged with our default configuration before the deployment. During this merging process, any new keys defined in your configuration will be added to the resulting configuration. Any value you define for existing keys will be overwritten. For example, you can define a 'centralservice' key with a 'dns_search' sub-key to overwrite the centralservices' dns settings. Make sure to set and verify the version at the top as a comment.</td>
<td>Ex:

```yaml
# cs_compose_version: 1.0

services:
  centralservice:
    dns_search:
      - informatik.rwth-aachen.de
```

</td>
</tr>

</table>

Afterward execute the CI/CD pipeline to finish the deployment. After a short while you should be able to navigate to https://requester.$YOUR_DOMAIN. Now, proceed to the next steps to finish your central service setup.

## Setup

### Keycloak

Before you can use the central service, you need to create clients in Keycloak. To do so, navigate to the Keycloak admin console and login with the admin credentials you provided during the deployment. Then, create two new clients, one for the frontend (central-service) and one for the backend (central-service-backend) with the following settings:

#### Frontend Client

```

Client ID: central-service
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: On
Implicit Flow Enabled: On
Direct Access Grants Enabled: On
Root URL: https://requester.$YOUR_DOMAIN
Valid Redirect URIs: https://requester.$YOUR_DOMAIN/*
Web Origins: https://requester.$YOUR_DOMAIN

```

#### Backend Client

```

Client ID: central-service-backend
Client Protocol: openid-connect
Access Type: confidential
Standard Flow Enabled: On
Implicit Flow Enabled: Off
Direct Access Grants Enabled: On
Service Accounts Enabled: On
Authorization Enabled: On
Root URL: https://requester.$YOUR_DOMAIN
Valid Redirect URIs: https://requester.$YOUR_DOMAIN/*
Web Origins: https://requester.$YOUR_DOMAIN
Backchannel Session Logout Required: On

```

You may also import the clients using the JSON files in the Keycloak Client Configs folder in this repository. Be sure to replace the placeholder domain variable (${SERVICE_DOMAIN}) in the files with your domain.

Once the clients are created, you can login to Central Service with Keycloak users.

#### Add `harbor` as an Audience for `central-service`
1. Navigate to the `central-service` client in Keycloak.
2. Go to the Client Scopes tab, and choose the `central-service-dedicated` client scope.
3. Add a new mapper with the following settings:
```
Name: harbor-audience
Mapper Type: Audience
Included Client Audience: harbor
Add to Access Token: On
Add to token introspection: On
```

## Development

For now, the development setup for the CS requires a second, non production PADME environment. The reason for this are dependent services required by the CS that need to be deployed separately. For this setup we do not yet have documentation available. Therefore, the development is (for now) restricted to members of the PADME team. If you are a team member, see [this internal wiki](https://docs.padme-analytics.de/en/internal/getting-started/dev-env-setup) for details.
