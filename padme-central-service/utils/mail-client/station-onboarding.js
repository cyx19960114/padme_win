const fs = require('fs');
const path = require('path');

const getMailBodyFilePath = () => {
    const fileName = 'station-onboarding-mail-body.html';
    const filePath = path.join(__dirname, fileName);
    return filePath
}

const getMailBody = () => {
    const body = fs.readFileSync(getMailBodyFilePath());
    return body;
}

const getMailBodyAttachments = () => {
    const imageDirName = 'station-onboarding-mail-images';
    const imageDirPath = path.join(__dirname, imageDirName);
    let attachments = [
        {
            filename: 'logo.png',
            cid: 'logo'
        },
        {
            filename: 'AI.jpg',
            cid: 'AI'
        },
        {
            filename: 'icon1.png',
            cid: 'icon1'
        },
        {
            filename: 'icon2.png',
            cid: 'icon2'
        },
        {
            filename: 'icon3.png',
            cid: 'icon3'
        },
        {
            filename: 'connect.jpg',
            cid: 'connect'
        }
    ];

    //set path
    attachments = attachments.map(x => { x.path = path.join(imageDirPath, x.filename); return x; });
    return attachments;
}

const getMailOptions = (mailTo, attachments) => {

    const mailFrom = process.env.MAIL_FROMADDRESS;
    const mailReply = process.env.MAIL_REPLYTOADDRESS;
    const mailSubject = 'PHT PADME - STATION ONBOARDING';

    const mailAttachments = getMailBodyAttachments().concat(attachments);
    const mailHtml = getMailBody();

    const mailOptions = {
        from: mailFrom,
        replyTo: mailReply,
        to: mailTo, //StationAdminEmailAddress
        subject: mailSubject,
        attachments: mailAttachments,
        html: mailHtml
    };

    return mailOptions;
}

module.exports = {

    getMailOptions

}

