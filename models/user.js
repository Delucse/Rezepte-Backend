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
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        verification: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index(
    { createdAt: -1 },
    {
        expireAfterSeconds: Number(process.env.VERIFY_TOKEN_EXPIRATION) - 59,
        partialFilterExpression: { verification: false },
    }
);

const User = mongoose.model('User', UserSchema);

const createIndex = async () => {
    const indexes = (await User.listIndexes()).filter(
        (i) => i.name === 'createdAt_-1'
    );
    if (
        indexes.length > 0 &&
        indexes[0].expireAfterSeconds !==
            Number(process.env.VERIFY_TOKEN_EXPIRATION) - 59
    ) {
        await User.collection.dropIndex('createdAt_-1');
        User.createIndexes();
    }
};
createIndex();

module.exports = User;
