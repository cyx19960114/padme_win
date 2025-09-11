####### Build image ########
FROM node:latest as build

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Disable husky in CI/Docker/Prod
# Install only production dependencies in the Docker image to reduce size
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

####### Production image ########
FROM gcr.io/projectsigstore/cosign:v2.2.1 as cosign-bin
FROM node:18.18.2-bullseye-slim

ENV NODE_ENV production
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init

# Create a directory for the lockfile and change the ownership of the directory to the "node" user and group
RUN mkdir /lockfiledir \
  && chown -R node:node /lockfiledir

WORKDIR /usr/src/app

# Change the ownership of the working directory to the non-root user "node"
RUN chown -R node:node /usr/src/app

# Switch to the non-root user "node"
USER node

# Copy cosign binary
COPY --from=cosign-bin /ko-app/cosign /usr/local/bin/cosign
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app

# Install dumb-init. Use this instead of node's built-in process manager
# to ensure that signals are properly forwarded to the node process.
CMD ["dumb-init", "node", "./bin/www"]
