FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

#Install dependencies for train requester
COPY TrainRequester/package*.json ./TrainRequester/
RUN cd TrainRequester && npm install

# Copy the remaining files
COPY . .

# Set the NODE_ENV to production
ENV NODE_ENV=production

EXPOSE 3000

#Normal entry point
#This entrypoint first performs a build of the UI
#Then starts the node application. The UI build has to be
#executed at run time to properly read configuration values
#from environment variables
ENTRYPOINT npm run migrate && npm run start