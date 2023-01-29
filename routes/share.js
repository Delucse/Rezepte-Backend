var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const Recipe = require('../models/recipe');
const recipe = require('./recipe');

api.get('/:id', async function (req, res) {
    const { id } = req.params;
    try {
        const aggregate = [];
        aggregate.push({
            $match: { _id: mongoose.Types.ObjectId(req.params.id) },
        });
        aggregate.push({
            $lookup: {
                from: 'pictures',
                let: { pictureArray: [{ $arrayElemAt: ['$pictures', 0] }] },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ['$_id', '$$pictureArray'] },
                        },
                    },
                ],
                as: 'pictures',
            },
        });
        aggregate.push({
            $project: {
                title: 1,
                picture: { $arrayElemAt: ['$pictures.file', 0] },
            },
        });

        const recipe = await Recipe.aggregate(aggregate);

        if (recipe.length > 0) {
            var params = '';
            if (req.query.portion) {
                params += `?portion=${req.query.portion}`;
            }
            if (req.query.form) {
                params += `${!params ? '?' : '&'}form=${req.query.form}`;
            }
            res.render('index', {
                title: `${recipe[0].title}`,
                description: `Delucse - Deine Plattform für Rezepte | Rezept finden, Portionsumfang einstellen, Zutaten zusammenstellen und kochen - Guten Appetit!`,
                pictureUrl: recipe[0].picture
                    ? `${process.env.MEDIA_URL}/${recipe[0].picture}`
                    : null,
                url: process.env.APP_BASE_URL,
                redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}${params}`,
            });
        } else {
            res.render('index', {
                title: `Delucse`,
                description: `Deine Plattform für Rezepte | Rezept finden, Portionsumfang einstellen, Zutaten zusammenstellen und kochen - Guten Appetit!`,
                url: process.env.APP_BASE_URL,
                redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}`,
            });
        }
    } catch (error) {
        res.render('index', {
            title: `Delucse`,
            description: `Deine Plattform für Rezepte | Rezept finden, Portionsumfang einstellen, Zutaten zusammenstellen und kochen - Guten Appetit!`,
            url: process.env.APP_BASE_URL,
            redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}`,
        });
    }
});

module.exports = api;
