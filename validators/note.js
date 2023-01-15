const { body, param } = require('express-validator');

const setNote = [
    body('text').trim().not().isEmpty().withMessage('text is required'),

    param('recipeId').custom((value) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('recipe-id is not a valid objectId');
        }
        return true;
    }),
];

const deleteNote = [
    param('recipeId').custom((value) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('recipe-id is not a valid objectId');
        }
        return true;
    }),
];

module.exports = {
    setNote,
    deleteNote,
};
