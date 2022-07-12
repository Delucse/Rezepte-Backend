var express = require('express');
var api = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const mongoose = require('mongoose');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const TokenBlacklist = require('../models/tokenBlacklist');

const { createToken, authorization, invalidateToken } = require('../helper/authorization');


api.post('/signup', async (req, res) => {
    try{
        // checking if user is already in db
        const emailExists = await User.findOne({email: req.body.email});
        if(emailExists) return res.status(409).send({message: 'Email already exists'});
        const usernameExists = await User.findOne({username: req.body.username});
        if(usernameExists) return res.status(409).send({message: 'Username already exists'});

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
          email: req.body.email,
          username: req.body.username,
          password: hashedPassword
        });

        const savedUser = await user.save();
        res.status(200).json({ message: "User was registered successfully!" });
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});


api.post('/signin', async (req, res) => {
    try{
        // checking if username exists
        const user = await User.findOne({username: req.body.username});
        if(!user) return res.status(403).send({message:'Username or password is wrong'});

        // checking if password is correct
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword) return res.status(403).send({message:'Username or password is wrong'});

        // create JWT-Token and refresh-Token
        const {token: token, refreshToken: refreshToken } = await createToken(user._id);

        res.status(200).send({
            user: user.username,
            token: token,
            refreshToken: refreshToken,
        });
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});


api.post('/signout', authorization, async (req, res) => {
    const rawAuthorizationHeader = req.header('authorization');
    const [, token] = rawAuthorizationHeader.split(' ');
    try {
        if(req.body.token){
            var deleteToken = await RefreshToken.deleteOne({token: req.body.token, user: req.user.id});
            if(deleteToken.deletedCount > 0){
                // invalidate JWT
                await invalidateToken(token);
                return res.status(200).json({message: 'Signed out successfully.'});
            } else {
                return res.status(401).json({message: 'Refresh Token does not exist.'});
            }
        } else {
            // invalidate JWT
            await invalidateToken(token);
            RefreshToken.deleteMany({user: req.user.id}).exec();
        }
        res.status(200).json({message: 'Signed out successfully.'});
        
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});


api.post('/refresh', async (req, res) => {
    try{
        const { token: requestToken } = req.body;
        if (requestToken == null) return res.status(403).json({ message: "Unauthorized" });
        const refreshToken = await RefreshToken.findOne({ token: requestToken });
        if (!refreshToken) return res.status(403).json({ message: "Unauthorized" });
        
        if (RefreshToken.verifyExpiration(refreshToken)) {
            RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();
            return res.status(403).json({message: "Refresh token was expired. Please make a new signin request"});
        }

        // create JWT-Token and refresh-Token
        const {token: newToken, refreshToken: newRefreshToken } = await createToken(refreshToken.user);
        RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();

        res.status(200).json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});



module.exports = api;
