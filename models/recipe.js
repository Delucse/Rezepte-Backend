// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

// Create Schema
const recipeSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        portion: {
            count: {
                type: Number,
                required: true,
            },
            art: {
                type: String,
                required: false,
            },
            form: [
                {
                    type: Number,
                },
            ],
        },
        time: {
            preparation: {
                type: Number,
                required: true,
            },
            resting: {
                type: Number,
                required: true,
            },
            baking: {
                type: Number,
                required: true,
            },
        },
        credits: {
            type: String,
            required: false,
        },
        keywords: [
            {
                type: String,
                required: true,
            },
        ],
        ingredients: [
            {
                _id: false,
                title: {
                    type: String,
                    required: false,
                },
                food: [
                    {
                        _id: false,
                        amount: {
                            type: Number,
                            required: true,
                        },
                        unit: {
                            type: String,
                            required: true,
                        },
                        aliment: {
                            type: String,
                            required: true,
                        },
                    },
                ],
            },
        ],
        steps: [
            {
                type: String,
                required: true,
            },
        ],
        pictures: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Picture',
            },
        ],
    },
    {
        timestamps: true,
        versionKey: 'updates',
        collation: { locale: 'de' },
    }
);

recipeSchema.index(
    {
        title: 'text',
        keywords: 'text',
        'ingredients.title': 'text',
        'ingredients.food.aliment': 'text',
        steps: 'text',
    },
    {
        default_language: 'de',
        name: 'all',
        collation: { locale: 'simple' },
    }
);

// prevent an empty array from being stored
recipeSchema.pre('save', function (next) {
    if (this.portion.form && this.portion.form.length === 0) {
        this.portion.form = undefined;
    }
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

Recipe.createIndexes();

module.exports = Recipe;
