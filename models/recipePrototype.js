// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

// Create Schema
const recipePrototypeSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: false,
        },
        title: {
            type: String,
            required: false,
        },
        portion: {
            count: {
                type: Number,
                required: false,
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
                required: false,
            },
            resting: {
                type: Number,
                required: false,
            },
            baking: {
                type: Number,
                required: false,
            },
        },
        keywords: [
            {
                type: String,
                required: false,
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
                            required: false,
                        },
                        unit: {
                            type: String,
                            required: false,
                        },
                        aliment: {
                            type: String,
                            required: false,
                        },
                    },
                ],
            },
        ],
        steps: [
            {
                type: String,
                required: false,
            },
        ],
    },
    {
        timestamps: true,
        versionKey: 'updates',
    }
);

recipePrototypeSchema.index(
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
    }
);

// prevent an empty array from being stored
recipePrototypeSchema.pre('save', function (next) {
    if (this.portion.form && this.portion.form.length === 0) {
        this.portion.form = undefined;
    }
    next();
});

const RecipePrototpye = mongoose.model(
    'RecipePrototype',
    recipePrototypeSchema
);

RecipePrototpye.createIndexes();

module.exports = RecipePrototpye;