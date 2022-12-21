var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const User = require('../models/user');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { authorization } = require('../helper/authorization');

const { send, email } = require('../utils/emailTransporter');

const resetPassword = require('../templates/resetPassword');

api.get('/', authorization, async (req, res) => {
    try {
        // checking if username exists
        const user = await User.findById(req.user.id);

        res.status(200).send({
            username: user.username,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/password', async (req, res) => {
    try {
        const { username } = req.body;

        // checking if user is in db
        const user = await User.findOne({ username: username });
        if (!user)
            return res.status(200).send({
                message: 'if username exists an email was successfully sent.',
            });

        const token = jwt.sign(
            { id: user._id },
            process.env.VERIFY_TOKEN_EXPIRATION + user.password,
            {
                expiresIn: Number(process.env.VERIFY_TOKEN_EXPIRATION),
            }
        );

        send(
            email(
                user.email,
                'Passwort zurücksetzen',
                resetPassword(user.username, token, user._id)
            )
        );

        res.status(200).json({
            message: 'if username exists an email was successfully sent.',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.put('/password/:id', async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;
        const { id } = req.params;

        if (!password || password === '' || password !== confirmPassword)
            return res.status(403).json({ message: 'Passwords do not match.' });

        if (!token)
            return res.status(403).send({ message: 'Token is missing.' });

        if (!/^.{24}$/.test(id))
            return res.status(403).json({ message: 'Invalid user' });

        const user = await User.findById(id);
        if (!user) return res.status(403).json({ message: 'Invalid user' });

        jwt.verify(
            token,
            process.env.VERIFY_TOKEN_EXPIRATION + user.password,
            async (err, decoded) => {
                if (err) {
                    return res
                        .status(403)
                        .json({ message: 'Token is not valid.' });
                }
                if (decoded.id !== user._id.toHexString())
                    return res.status(403).json({ message: 'Invalid user' });

                // hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const updatedUser = await User.findOneAndUpdate(
                    { _id: decoded.id },
                    { password: hashedPassword }
                );

                res.status(200).json({
                    message: 'Password was changed successfully!',
                });
            }
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
