// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    expiryDate: {
        type: Date,
        required: true,
        expires: Number(process.env.REFRESH_TOKEN_EXPIRATION)
    }
});

RefreshTokenSchema.statics.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
}


module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);