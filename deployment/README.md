# Deployment image

This repository contains the docker image that we use to deploy the PADME ecosystem services. This image contains all the dependencies needed during deployment. For example, it provides the ssh-client and helper scripts, such as the script that substitutes variables (like passwords) with the intended values during the deployment. This script is used to adjust the docker compose files for the intended deployment target. Overall, this image reduces the commands that are needed in the CI/CD jobs, prevents code duplication, and ensures the setup is the same for all deployment jobs. In order to be useable with your target machine, this image has to be configured with the correct public keys for the ssh connection. See the next section for details on the configuration.

See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Configuring or adding host keys for the deployment

This image contains the ssh-agent used during deployments. To ensure the ssh connections during the deployment are performed against the correct target machines, this image contains the host keys of those targets. Those keys will be verified whenever a new ssh connection is made. Consequently, you need to adjust this image with the host keys of your target machine(s) as follows:

1. SSH into the machine you want to use as a deployment target
2. Execute the following
```
cat /etc/ssh/ssh_host_ecdsa_key.pub
cat /etc/ssh/ssh_host_rsa_key.pub
cat /etc/ssh/ssh_host_ed25519_key.pub
```
3. Store the output (one line per command) to the ```KNOWN_HOST_KEYS``` variable in the repositories' CI/CD settings in GitLab. If the variables does not yet exist, create it.

Leave out the part with "root@.." and add the hostname in front. Here is an example:

Say you want to add the host key of ```host1.personal-health-train.com``` and you get the following output:

```
user@host1.personal-health-train.com:/etc/ssh$ cat /etc/ssh/ssh_host_ecdsa_key.pub
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBA9Qcdx8q17eg3z/57gg960drO6xKq93MlfkX1JILLQxNUVSJm9nd8OOuc2g9G+rfPZ+bN1F/l6RfL5/ko1kSJE= root@debian-template
```

Then create the following line in the known_hosts file:
```
host1.personal-health-train.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBA9Qcdx8q17eg3z/57gg960drO6xKq93MlfkX1JILLQxNUVSJm9nd8OOuc2g9G+rfPZ+bN1F/l6RfL5/ko1kSJE=
```

3. Trigger a new build of the image via the pipeline in GitLab