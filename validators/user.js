const { body, param } = require('express-validator');

const resetPassword = [
    body('username').not().isEmpty().withMessage('username is required'),
];

const setPassword = [
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

    body('token').not().isEmpty().withMessage('token is required'),

    param('id').custom((value) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('id is not a valid objectId');
        }
        return true;
    }),
];

const newPassword = [
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
];

module.exports = {
    resetPassword,
    setPassword,
    newPassword,
};
