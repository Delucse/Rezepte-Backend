// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const TokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true,
        expires: Number(process.env.JWT_EXPIRATION)
    }
});

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);