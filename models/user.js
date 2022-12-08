// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            required: true,
        },
        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Recipe',
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', UserSchema);
