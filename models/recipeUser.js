// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

const RecipeUserSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true,
        },
        favorite: {
            type: Boolean,
            default: false,
        },
        note: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const RecipeUser = mongoose.model('RecipeUser', RecipeUserSchema);

module.exports = RecipeUser;
