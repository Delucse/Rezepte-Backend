// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

// schema for user
const pictureSchema = mongoose.Schema(
    {
        contentType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        file: {
            type: String,
            required: true,
        },
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
    },
    {
        timestamps: true,
        versionKey: 'updates',
    }
);

module.exports = mongoose.model('Picture', pictureSchema);
