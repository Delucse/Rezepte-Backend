const nodemailer = require('nodemailer');

const address = process.env.MAIL_ADDRESS;
const password = process.env.MAIL_PASSWORD;
const host = process.env.MAIL_HOST;
const port = Number(process.env.MAIL_PORT);

const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: false, // if false TLS
    auth: {
        user: address, // email of the sender
        pass: password, // Passwort of the sender
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
    },
});

const email = (to, subject, html) => {
    return {
        from: `"Delucse Support" ${address}`,
        to: to,
        subject: subject,
        html: html,
    };
};

const send = (mailOptions) => {
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(
                'Email-Configuration is not complete respectively incorrect. More info:'
            );
            console.log(error);
        }
    });
};

module.exports = { email, send };
