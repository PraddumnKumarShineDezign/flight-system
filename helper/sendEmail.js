const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: config.smtp.host,
    port: 587,
    secure: false,
    auth: {
        user: config.smtp.auth.user || "example@gmail.com",
        pass: config.smtp.auth.pass || "1234 2545 5454 5454"
    },

})

async function sendMail(to, html, subject, attachments = []) {
    try {
        console.log("attachments", attachments);

        let l = await transporter.sendMail({
            to: to,
            from: config.smtp.auth.user,
            html: html,
            subject: subject,
            attachments: attachments
        });
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error)
    }
}


function replaceVariablesInTemplate(template, variables) {
    try {
        for (const key in variables) {
            template = template.replace(new RegExp(key, 'g'), variables[key])
        }
        return template;
    } catch (error) {
        return '';
    }
}

module.exports = {
    sendMail,
    replaceVariablesInTemplate
}