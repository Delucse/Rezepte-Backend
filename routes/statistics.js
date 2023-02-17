var express = require('express');
var api = express.Router();

const User = require('../models/user');
const Picture = require('../models/picture');
const Recipe = require('../models/recipe');

api.get('/', async function (req, res, next) {
    const aggregation = [
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1,
            },
        },
    ];
    const userCount = await User.aggregate(aggregation);
    const recipeCount = await Recipe.aggregate(aggregation);
    const imageCount = await Picture.aggregate(aggregation);

    res.json({ users: userCount, recipes: recipeCount, images: imageCount });
});

module.exports = api;
