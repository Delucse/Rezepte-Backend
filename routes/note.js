var express = require('express');
var note = express.Router();

const { authorization } = require('../helper/authorization');

const mongoose = require('mongoose');
const RecipeUser = require('../models/recipeUser');

const validate = require('../validators/index');
const { setNote, deleteNote } = require('../validators/note');

note.post('/:recipeId', authorization, setNote, validate, async (req, res) => {
    try {
        const info = await RecipeUser.findOneAndUpdate(
            { user: req.user.id, recipe: req.params.recipeId },
            { note: req.body.text },
            {
                new: true,
                upsert: true,
            }
        );
        res.status(201).send({
            msg: 'created recipe note successfully',
        });
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

note.delete(
    '/:recipeId',
    authorization,
    deleteNote,
    validate,
    async (req, res) => {
        try {
            const info = await RecipeUser.findOneAndUpdate(
                { user: req.user.id, recipe: req.params.recipeId },
                { note: '' }
            );
            if (info) {
                res.send({ msg: 'deleted recipe note successfully' });
            } else {
                res.status(400).send({ msg: 'recipe note does not exists' });
            }
        } catch (e) {
            res.status(500).json({ msg: e.message });
        }
    }
);

module.exports = note;
