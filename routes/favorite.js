var express = require('express');
var favorite = express.Router();

const { authorization } = require('../helper/authorization');

const mongoose = require('mongoose');
const User = require('../models/user');

favorite.post('/:recipeId', authorization, async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            {
                _id: req.user.id,
                favorites: { $not: { $in: [req.params.recipeId] } },
            },
            { $push: { favorites: req.params.recipeId } }
        );
        if (user) {
            res.status(201).send({
                msg: 'created recipe favorite successfully',
            });
        } else {
            res.status(200).send({ msg: 'recipe favorite already exists' });
        }
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

favorite.delete('/:recipeId', authorization, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, {
            $pull: { favorites: req.params.recipeId },
        });
        if (user.favorites.includes(req.params.recipeId)) {
            res.send({ msg: 'deleted recipe favorite successfully' });
        } else {
            res.status(400).send({ msg: 'recipe favorite does not exists' });
        }
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

module.exports = favorite;
