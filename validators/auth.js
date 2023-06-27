const { body } = require('express-validator');

const signup = [
    body('username')
        .not()
        .isEmpty()
        .withMessage('username is required')
        .bail()
        .trim()
        .isLength({ min: 3 })
        .withMessage('the username must have minimum length of 3'),

    body('email')
        .not()
        .isEmpty()
        .withMessage('email is required')
        .bail()
        .isEmail()
        .withMessage('invalid email address')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .not()
        .isEmpty()
        .withMessage('password is required')
        .bail()
        .trim()
        .isLength({ min: 8 })
        .withMessage('your password should have min length of 8'),

    body('confirmPassword')
        .not()
        .isEmpty()
        .withMessage('confirmPassword is required')
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('confirm password does not match');
            }
            return true;
        }),

    body('relation')
        .not()
        .isEmpty()
        .withMessage('relation is required')
        .bail()
        .trim()
        .isLength({ min: 3 })
        .withMessage('relation must have minimum length of 3'),
];

const verification = [
    body('token').not().isEmpty().withMessage('token is required'),
];

const signin = [
    body('username').not().isEmpty().withMessage('username is required'),
    body('password').not().isEmpty().withMessage('password is required'),
];

module.exports = {
    signup,
    verification,
    signin,
};
