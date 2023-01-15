const { param } = require('express-validator');

const setFavorite = [
    param('recipeId').custom((value) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('recipe-id is not a valid objectId');
        }
        return true;
    }),
];

const deleteFavorite = [
    param('recipeId').custom((value) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('recipe-id is not a valid objectId');
        }
        return true;
    }),
];

module.exports = {
    setFavorite,
    deleteFavorite,
};
