var express = require('express');
var api = express.Router();

const { send, email } = require('../utils/emailTransporter');

const contactMail = require('../templates/contact');

const validate = require('../validators/index');
const { contact } = require('../validators/mail');

api.post('/contact', contact, validate, async (req, res) => {
    try {
        send(
            email(
                process.env.MAIL_ADRESS_CONTACT,
                `Kontaktanfrage: ${req.body.subject}`,
                req.body.message,
                false,
                req.body.email
            )
        );
        send(
            email(
                req.body.email,
                'Kontaktanfrage',
                contactMail(req.body.subject, req.body.message),
                false,
                process.env.MAIL_ADRESS_CONTACT
            )
        );
        res.status(200).json({ message: 'mail sent successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
