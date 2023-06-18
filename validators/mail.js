const { body } = require('express-validator');

const contact = [
    body('email')
        .not()
        .isEmpty()
        .withMessage('email is required')
        .bail()
        .isEmail()
        .withMessage('invalid email address'),

    body('subject').not().isEmpty().withMessage('subject is required'),

    body('message').not().isEmpty().withMessage('message is required'),
];

module.exports = {
    contact,
};
