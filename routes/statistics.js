var express = require('express');
var api = express.Router();

const User = require('../models/user');
const Picture = require('../models/picture');
const Recipe = require('../models/recipe');
const RecipeUser = require('../models/recipeUser');

const countAggregation = [
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
    {
        $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            count: 1,
        },
    },
];

const mostAggregation = (match) => {
    var aggregation = [];
    if (match) {
        aggregation.push({
            $match: match,
        });
    }
    aggregation = aggregation.concat([
        {
            $group: {
                _id: '$user',
                count: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                count: -1,
                _id: 1,
            },
        },
        {
            $limit: 1,
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $project: {
                _id: 0,
                name: {
                    $arrayElemAt: ['$user.username', 0],
                },
                count: 1,
            },
        },
    ]);
    return aggregation;
};

api.get('/', async function (req, res, next) {
    const userCount = await User.aggregate(countAggregation);
    const recipeCount = await Recipe.aggregate(countAggregation);
    const mostRecipes = await Recipe.aggregate(mostAggregation());
    const imageCount = await Picture.aggregate(countAggregation);
    const mostImages = await Picture.aggregate(mostAggregation());
    const totalFavorites = await RecipeUser.aggregate([
        {
            $match: {
                favorite: true,
            },
        },
        {
            $count: 'count',
        },
    ]);
    const mostFavorites = await RecipeUser.aggregate(
        mostAggregation({ favorite: true })
    );
    const favoriteRecipe = await RecipeUser.aggregate([
        {
            $match: {
                favorite: true,
            },
        },
        {
            $group: {
                _id: '$recipe',
                count: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                count: -1,
                _id: 1,
            },
        },
        {
            $limit: 1,
        },
        {
            $lookup: {
                from: 'recipes',
                localField: '_id',
                foreignField: '_id',
                as: 'recipe',
            },
        },
        {
            $project: {
                _id: { $arrayElemAt: ['$recipe._id', 0] },
                title: {
                    $arrayElemAt: ['$recipe.title', 0],
                },
                count: 1,
            },
        },
    ]);

    res.json({
        users: { count: userCount },
        recipes: {
            count: recipeCount,
            user:
                mostRecipes.length > 0
                    ? mostRecipes[0]
                    : { count: 0, name: '' },
        },
        images: {
            count: imageCount,
            user:
                mostImages.length > 0 ? mostImages[0] : { count: 0, name: '' },
        },
        favorites: {
            user:
                mostFavorites.length > 0
                    ? mostFavorites[0]
                    : { count: 0, name: '' },
            recipe:
                favoriteRecipe.length > 0
                    ? favoriteRecipe[0]
                    : { count: 0, _id: '', title: '' },
            total: totalFavorites.length > 0 ? totalFavorites[0].count : 0,
        },
    });
});

module.exports = api;
