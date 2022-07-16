// jshint esversion: 6
// jshint node: true
'use strict';

const mongoose = require('mongoose');

const TitleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Title', TitleSchema);
