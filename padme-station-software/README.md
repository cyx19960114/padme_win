<h1 align="center">PADME Station Software</h1>
<p align="center">
  <img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release">
  <img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg">
</p>

This repository contains the edge client of the PADME ecosystem, called the PADME Station Software. See [the documentation](https://docs.padme-analytics.de/) for more information on the different PADME services and the service architecture. An overview of all open source services is available [here](https://git.rwth-aachen.de/padme-development).

Visit our website at [padme-analytics.de](https://padme-analytics.de).

## Usages

Use the docker-compose files

### Why would you need to enable TLS for Docker API?
If you want to expose Docker API on a network and if you use shared network namespaces (as in Kubernetes pods), this is a potential security issue (which can lead to access to the host system, for example). It is recommended to enable TLS, then Docker API will be reachable through the network in a safe manner.

### How to enable TLS for Docker API?
You can follow the Docker Docs instructions:
https://docs.docker.com/engine/security/https/

We have also prepared a deployment guide and a script that could be helpful.
The provided script generates a CA, server, and client keys with OpenSSL.

Inside the directory that you specified, the script will create three directories:
* ca: the certificate authority files (cert.pem, key.pem)
* server: the dockerd (daemon) certificate files (cert.pem, ca.pem, key.pem)
* client: the client certificate files (cert.pem, ca.pem, key.pem)


**Note:** It is conventional to use port 2375 for un-encrypted communication with the daemon. Docker over TLS should run on TCP port 2376.

**Note:** If you use the dind image, it will automatically generate TLS certificates in the directory specified by the DOCKER_TLS_CERTDIR environment variable.

### What is Docker in Docker (dind)?
Docker in Docker (dind) is a Docker container hosting Docker machine. In other words, dind allows the Docker engine to run as a Container inside Docker. This link is the official repository for dind.

### Would you need dind?
Basically, you do not force to use dind. But if you would like to isolate the docker environment, in which the trains will run, from your host docker environment, it could be a good approach. 
Plus you may not want to change docker configs on the host environment (for example you use Kubernetes clusters or you don't want to enable TCP Socket for docker daemon), in this case, you may need to use Docker in Docker. 

## Developement

For developement on the Station Software, please ensure that you do the following:

* no developement on main branch: Never push changes directly to the main branch, it is connected to the deployement pipeline
* our developement branch is `prerelease`
* for each feature or bug fix create a branch, do not develop directly on prerelease. If the developement branch is finished, create a merge request
* Before merging, you have to ensure that all tests passes and you should run eslint with the fix flag to ensure code quality
* In the merge request view, you can inspect whether the overall code quality declines with that merge. If the decline is too big, do not merge that request without fixing the violations.

### Tests
If possible write unit tests for all code you implement. We use the [jest testing framework](https://jestjs.io). You can run all tests with `npx run jest`.
To hold the tests for one javascript file a.js, create a corrosponding test file a.test.js.

### Static code analysis
For ensuring code quality and to prevent bugs, we use eslint for static code analysis. You can run the linter with `npx run eslint .`.
Ensure that the linter does not produce any critical error and as few warnings as possible. You can use the linter to fix some errors by adding a `--fix` flag.

### Major Release Commit

### Minor Release Commit