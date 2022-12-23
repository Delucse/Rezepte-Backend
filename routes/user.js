var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const User = require('../models/user');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { authorization } = require('../helper/authorization');

const { send, email } = require('../utils/emailTransporter');

const queryNewPassword = require('../templates/resetPassword');

const validate = require('../validators/index');
const { resetPassword, setPassword } = require('../validators/user');

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

api.post('/password', resetPassword, validate, async (req, res) => {
    try {
        // checking if user is in db
        const user = await User.findOne({
            username: req.body.username,
            verification: true,
        });
        if (!user)
            return res.status(200).send({
                message: 'if username exists, then an email was sent',
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
                queryNewPassword(user.username, token, user._id)
            )
        );

        res.status(200).json({
            message: 'if user exists, then an email was sent',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.put('/password/:id', setPassword, validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(403).json({ message: 'invalid user' });

        jwt.verify(
            req.body.token,
            process.env.VERIFY_TOKEN_EXPIRATION + user.password,
            async (err, decoded) => {
                if (err) {
                    return res
                        .status(403)
                        .json({ message: 'token is not valid' });
                }
                if (decoded.id !== user._id.toHexString())
                    return res.status(403).json({ message: 'invalid user' });

                // hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(
                    req.body.password,
                    salt
                );

                await User.findOneAndUpdate(
                    { _id: decoded.id },
                    { password: hashedPassword }
                );

                res.status(200).json({
                    message: 'password changed',
                });
            }
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
