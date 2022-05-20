const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const moment = require('moment');

const RefreshToken = require('../models/refreshToken');
const User = require('../models/user');
const TokenBlacklist = require('../models/tokenBlacklist');

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
    if (err instanceof TokenExpiredError) {
        return res.status(401).send({ message: "Unauthorized" });
    }
    return res.sendStatus(401).send({ message: "Unauthorized" });
}

const authorization = (req, res, next) => {
    // get JWT from authorization-header
    const rawAuthorizationHeader = req.header('authorization');
    var token;
    if(rawAuthorizationHeader){
        [, token] = rawAuthorizationHeader.split(' ');
    }
  
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            // return catchError(err, res);
            return res.status(401).json({ message: "Unauthorized" });
        }
        var invalid = await TokenBlacklist.findOne({token: token});
        if(invalid){
            return res.status(401).json({ message: "Unauthorized" });
        }
        var user = await User.findById(decoded.id);
        if(!user){
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = {
            id: user._id,
            username: user.username
        }
        next();
    });
};

const createToken = (id) => {
    const payload = {id: id};
    const options = {expiresIn: Number(process.env.JWT_EXPIRATION)};

    return new Promise(function (resolve, reject) {
        jwt.sign(payload, process.env.JWT_SECRET, options, async (err, token) => {
            if (err) {
                return reject(err);
            }

            const refreshToken = hashJWT(token);
            try {
                const object = new RefreshToken({
                    token: refreshToken,
                    user: id,
                    expiryDate: moment.utc().add(Number(process.env.REFRESH_TOKEN_EXPIRATION), 's').toDate(),
                });
                await object.save();

                return resolve({token: token, refreshToken: refreshToken});
            } catch (err) {
                return reject(err);
            }
        });
    });
};

const invalidateToken = async (token) => {
    var newBlacklistedToken = new TokenBlacklist({
        token: token,
        expiryDate: moment.utc().add(Number(process.env.JWT_EXPIRATION), 's').toDate(),
    });
    await newBlacklistedToken.save();
};

// @see: https://github.com/sensebox/openSenseMap-API/blob/461777e52f8568a6f234945fbae083688a7edb59/packages/api/lib/helpers/jwtRefreshTokenHasher.js
const hashJWT = (jwtString) => {
    if (typeof jwtString !== 'string') {
      throw new Error('method hashJWT expects a string parameter');
    }
    return crypto
      .createHmac('sha512', process.env.REFRESH_TOKEN_SECRET)
      .update(jwtString)
      .digest('base64');
};



  module.exports = {
    authorization,
    createToken,
    invalidateToken
  };
