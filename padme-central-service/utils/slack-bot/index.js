const { App } = require('@slack/bolt');
const { getEnvOrThrow } = require('./../environment');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const getClientInstance = () => {

    try {
        
        const app = new App({
            token: SLACK_BOT_TOKEN,
            signingSecret: SLACK_SIGNING_SECRET,
        });

        const client = app.client;
    
        return Promise.resolve(client);
        
    } catch (error) {
        return Promise.reject(error);
    }
}

const getPadmeChannelId = () => {
    return getEnvOrThrow("SLACK_PADME_CHANNEL_ID");
}

module.exports = {
    getClientInstance,
    getPadmeChannelId
};