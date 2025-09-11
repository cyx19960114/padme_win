# Reverse Proxy

To provide our services to the outer world, we use a NGINX based reverse proxy configuration. This repository deploys this reverse proxy and a companion container that acts as a Let's  Encrypt certificate bot.

This configuration is based on the [nginx-proxy project on Github](https://github.com/nginx-proxy), you can find more details there. This proxy uses the docker API to dynamically generate its NGINX configuration and the corresponding certificates. If you want to add a new target for the proxy, add the following configuration to the target container:

```
...
environment:
    VIRTUAL_HOST: "example.${SERVICE_DOMAIN}, www.example.${SERVICE_DOMAIN}"
    LETSENCRYPT_HOST: "example.${SERVICE_DOMAIN}, www.example.${SERVICE_DOMAIN}"
    ...
networks:
    proxynet:
```
(SERVICE_DOMAIN is a environment variable that is set via the GitLab group CI/CD ENV to the corresponding target, depending on production/staging)

## Deployment

To deploy this service, first view the [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you are familiar with the procedure, please define the following CI/CD variables in your mirrored repository:

| Variable Name             | Description                                                                                                                                                                                           | Example value                       |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| DEPLOYMENT_TARGET_DIR     | The directory on the target host where the proxy compose file will be stored. We recommend the provide the exemplary value                                                                                | /home/deployment/Proxy/             |
| DEPLOYMENT_TARGET_HOST    | The username and host where the proxy should be deployed to. This needs to be in the format user@host                                                                                                      | deployment@TARGET_MACHINE_HOST_NAME |
| DEPLOYMENT_TARGET_SSH_KEY | The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here. | MACHINE_NAME_PRIVATE_KEY            |

Afterward, execute the CI/CD pipeline to finish the deployment. If you are a member of the main PADME environment (padme-analytics.de), please also consider the following information.

### PADME main ecosystem deployment

If the Reverse Proxy is deployed for the first time in our ecosystem, this requires a two-step deployment due to redirects that provide backwards-compatibility. Those redirects rely on a certificate that has to be created first. Therefore, please execute the following two-stage deployment for production:

1. Change the $DOCKER_TARGET variable in the 'build_reverse_proxy_with_redirects' step in the gitlab-ci.yml to have the value 'image'. Do a deployment and check the logs of the certifcate bot -> wait for the certificates to be created.
2. Change the $DOCKER_TARGET back to the value 'image-with-redirects' and deploy again

Done!