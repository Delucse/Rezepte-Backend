const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const User = require('../models/user');

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
    if (err instanceof TokenExpiredError) {
        return res.status(401).send({ message: 'unauthorized' });
    }
    return res.sendStatus(401).send({ message: 'unauthorized' });
};

const authorization = (req, res, next) => {
    // get JWT from authorization-header
    const rawAuthorizationHeader =
        req.header('authorization') || req.header('Authorization');
    var token;
    if (rawAuthorizationHeader) {
        [, token] = rawAuthorizationHeader.split(' ');
    }

    if (!token) {
        return res.status(401).json({ message: 'unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            // return catchError(err, res);
            return res.status(401).json({ message: 'unauthorized' });
        }
        var user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'unauthorized' });
        }
        req.user = {
            id: user._id,
            username: user.username,
        };
        next();
    });
};

const getUser = (req, res, next) => {
    // get JWT from authorization-header
    const rawAuthorizationHeader =
        req.header('authorization') || req.header('Authorization');
    var token;
    if (rawAuthorizationHeader) {
        [, token] = rawAuthorizationHeader.split(' ');
    }

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            // return catchError(err, res);
            return res.status(401).json({ message: 'unauthorized' });
            // return next();
        }
        var user = await User.findById(decoded.id);
        if (!user) {
            return next();
        }
        req.user = {
            id: user._id,
            username: user.username,
        };
        next();
    });
};

const createToken = async (id) => {
    const payload = { id: id };

    const accessToken = await jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: Number(process.env.JWT_EXPIRATION),
    });

    const refreshToken = await jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRATION),
        }
    );

    return {
        token: accessToken,
        refreshToken: refreshToken,
    };
};

module.exports = {
    authorization,
    getUser,
    createToken,
};
