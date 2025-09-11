const nodemailer = require('nodemailer');
const stationOnboarding = require('./station-onboarding');

const getTransporter = () => {

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USERNAME?.length > 0 ? process.env.MAIL_USERNAME : undefined,
            pass: process.env.MAIL_PASSWORD?.length > 0 ? process.env.MAIL_PASSWORD : undefined
        },
        secure: process.env.MAIL_USESMTPS === 'true' ? true : false, // use TLS
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: process.env.MAIL_VERIFYSMTPS === 'true' ? true : false,
        },
    });

    return transporter;
}

if (process.env.MAIL_HOST) {
    // verify connection configuration
    getTransporter().verify(function (error, success) {
        if (error) {
            console.error("Mail server verification error.");
            console.log(error);
        } else {
            console.log("Mail server is ready to take our messages.");
        }
    });
}
else
    console.error("Email host is not configured.");

module.exports = {
    stationOnboarding,
    getTransporter
};
