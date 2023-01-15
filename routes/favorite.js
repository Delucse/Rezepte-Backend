var express = require('express');
var favorite = express.Router();

const { authorization } = require('../helper/authorization');

const mongoose = require('mongoose');
const RecipeUser = require('../models/recipeUser');

const validate = require('../validators/index');
const { setFavorite, deleteFavorite } = require('../validators/favorite');

favorite.post(
    '/:recipeId',
    authorization,
    setFavorite,
    validate,
    async (req, res) => {
        try {
            const info = await RecipeUser.findOneAndUpdate(
                { user: req.user.id, recipe: req.params.recipeId },
                { favorite: true },
                {
                    new: true,
                    upsert: true,
                }
            );
            res.status(201).send({
                msg: 'created recipe favorite successfully',
            });
        } catch (e) {
            res.status(400).json({ msg: e.message });
        }
    }
);

favorite.delete(
    '/:recipeId',
    authorization,
    deleteFavorite,
    validate,
    async (req, res) => {
        try {
            const info = await RecipeUser.findOneAndUpdate(
                { user: req.user.id, recipe: req.params.recipeId },
                { favorite: false }
            );
            if (info) {
                res.send({ msg: 'deleted recipe favorite successfully' });
            } else {
                res.status(400).send({
                    msg: 'recipe favorite does not exists',
                });
            }
        } catch (e) {
            res.status(400).json({ msg: e.message });
        }
    }
);

module.exports = favorite;
