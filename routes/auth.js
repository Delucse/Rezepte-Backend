var express = require('express');
var api = express.Router();

const jwt = require('jsonwebtoken');
const cryptojs = require('crypto-js');

const mongoose = require('mongoose');
const User = require('../models/user');

const { createToken } = require('../helper/authorization');

const { send, email } = require('../utils/emailTransporter');

const verifyEmail = require('../templates/verifyEmail');

const validate = require('../validators/index');
const { signup, verification, signin, signout } = require('../validators/auth');

api.post('/signup', signup, validate, async (req, res) => {
    try {
        // checking if user is already in db
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists)
            return res.status(409).send({ message: 'email already exists' });
        const usernameExists = await User.findOne({
            username: {
                $regex: `^${req.body.username}$`,
                $options: 'i',
            },
        });
        if (usernameExists)
            return res.status(409).send({ message: 'username already exists' });

        const user = new User({
            email: req.body.email,
            username: req.body.username,
            password: cryptojs.AES.encrypt(
                req.body.password,
                process.env.PASSWORD_SECRET
            ).toString(),
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.VERIFY_TOKEN_SECRET,
            {
                expiresIn: Number(process.env.VERIFY_TOKEN_EXPIRATION),
            }
        );

        const savedUser = await user.save();

        send(
            email(
                savedUser.email,
                'E-Mail verifizieren',
                verifyEmail(savedUser.username, token)
            )
        );

        res.status(200).json({ message: 'user is registered' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/verification', verification, validate, async (req, res) => {
    try {
        const { token } = req.body;

        jwt.verify(
            token,
            process.env.VERIFY_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res
                        .status(403)
                        .json({ message: 'token is not valid' });
                }

                const user = await User.findOneAndUpdate(
                    { _id: decoded.id },
                    { verification: true }
                );

                if (!user)
                    return res
                        .status(403)
                        .json({ message: 'token is not valid' });

                res.status(200).json({
                    message: 'user is verified',
                });
            }
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/signin', signin, validate, async (req, res) => {
    try {
        // checking if username exists
        const user = await User.findOne({ username: req.body.username });
        if (!user)
            return res
                .status(403)
                .send({ message: 'username or password is wrong.' });

        if (!user.verification)
            return res.status(403).send({ message: 'user is not verified.' });

        // checking if password is correct
        const hashedPassword = cryptojs.AES.decrypt(
            user.password,
            process.env.PASSWORD_SECRET
        );
        const validPassword =
            hashedPassword.toString(cryptojs.enc.Utf8) === req.body.password;

        if (!validPassword)
            return res
                .status(403)
                .send({ message: 'username or password is wrong.' });

        // create access- and refresh-Token
        const { token: token, refreshToken: refreshToken } = await createToken(
            user._id
        );

        // create secure cookie with refresh token
        res.cookie('token', refreshToken, {
            httpOnly: true, // accessible only by web server
            secure: true, // https
            sameSite: 'None', //cross-site cookie
            maxAge: Number(process.env.REFRESH_TOKEN_EXPIRATION) * 1000, // cookie expiry: set to match rT
        });

        res.status(200).send({
            user: user.username,
            token: token,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/signout', async (req, res) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.token) return res.sendStatus(204); //No content
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        });
        res.status(200).json({ message: 'signed out' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/refresh', async (req, res) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.token)
            return res.status(403).json({ message: 'unauthorized' });

        const refreshToken = cookies.token;

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err)
                    return res.status(403).json({ message: 'unauthorized' });

                const user = await User.findById(decoded.id);

                if (!user)
                    return res.status(403).json({ message: 'Unauthorized' });

                // create access- and refresh-Token
                const { token: token, refreshToken: refreshToken } =
                    await createToken(user._id);

                // create secure cookie with refresh token
                res.cookie('token', refreshToken, {
                    httpOnly: true, // accessible only by web server
                    secure: true, // https
                    sameSite: 'None', //cross-site cookie
                    maxAge: Number(process.env.REFRESH_TOKEN_EXPIRATION) * 1000, // cookie expiry: set to match rT
                });

                res.status(200).send({
                    user: user.username,
                    token: token,
                });
            }
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
