# Playground Frontend

## Development Setup

The frontend is written in angular with the material theme. It also has support for dev containers (like the backend).

To start development, simple execute the following steps: 

1. Start the dev container of the frontend and backend (see backend README for details). The backend is needed because it contains the local keycloak setup.
2. execute `npm install` in this folder to get all dependencies
3. execute `ng serve` to build current app and serve a development server
4. open http://localhost:4200 to access the instance

Of course this requires a valid npm/node installation.

Please be aware that this frontend is supposed to be running with a local instance of the backend that also provides a keycloak instance.

## Other things to consider

In the development mode of the frontend some features are disabled (e.g. preventing page reloads when files are changed but not yet downloaded) to make the development easier.
Moreover, in development mode some data is mocked so that you can e.g. directly open the /playground page without creating a session in the backend beforehand. 

For details, please take a look at the dev/prod environment configuration files.