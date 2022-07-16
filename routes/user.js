var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const User = require('../models/user');

const { authorization } = require('../helper/authorization');

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

module.exports = api;
