var express = require('express');
var api = express.Router();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const TokenBlacklist = require('../models/tokenBlacklist');

const {
    createToken,
    authorization,
    invalidateToken,
} = require('../helper/authorization');

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
            username: req.body.username,
        });
        if (usernameExists)
            return res.status(409).send({ message: 'username already exists' });

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
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
        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!validPassword)
            return res
                .status(403)
                .send({ message: 'username or password is wrong.' });

        // create JWT-Token and refresh-Token
        const { token: token, refreshToken: refreshToken } = await createToken(
            user._id
        );

        res.status(200).send({
            user: user.username,
            token: token,
            refreshToken: refreshToken,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/signout', authorization, signout, validate, async (req, res) => {
    const rawAuthorizationHeader = req.header('authorization');
    const [, token] = rawAuthorizationHeader.split(' ');
    try {
        if (req.body.token) {
            var deleteToken = await RefreshToken.deleteOne({
                token: req.body.token,
                user: req.user.id,
            });
            if (deleteToken.deletedCount > 0) {
                // invalidate JWT
                await invalidateToken(token);
                return res.status(200).json({ message: 'signed out' });
            } else {
                return res
                    .status(401)
                    .json({ message: 'refresh token does not exist' });
            }
        } else {
            // invalidate JWT
            await invalidateToken(token);
            RefreshToken.deleteMany({ user: req.user.id }).exec();
        }
        res.status(200).json({ message: 'signed out' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/refresh', async (req, res) => {
    try {
        const { token: requestToken } = req.body;
        if (requestToken == null)
            return res.status(403).json({ message: 'unauthorized' });
        const refreshToken = await RefreshToken.findOne({
            token: requestToken,
        });
        if (!refreshToken)
            return res.status(403).json({ message: 'unauthorized' });

        if (RefreshToken.verifyExpiration(refreshToken)) {
            RefreshToken.findByIdAndRemove(refreshToken._id, {
                useFindAndModify: false,
            }).exec();
            return res.status(403).json({
                message:
                    'refresh token expired, please make a new signin request',
            });
        }

        // create JWT-Token and refresh-Token
        const { token: newToken, refreshToken: newRefreshToken } =
            await createToken(refreshToken.user);
        RefreshToken.findByIdAndRemove(refreshToken._id, {
            useFindAndModify: false,
        }).exec();

        res.status(200).json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
