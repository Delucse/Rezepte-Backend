var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const Recipe = require('../models/recipe');

const fs = require('fs');

const fileExtension = 'webp';

const description =
    'Deine Plattform für Rezepte | Rezept finden, Portionsumfang einstellen, Zutaten zusammenstellen und kochen - Guten Appetit!';

api.get('/:id', async function (req, res) {
    const { id } = req.params;
    try {
        const recipe = await Recipe.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(id) },
            },
            {
                $project: {
                    title: 1,
                    pictures: 1,
                },
            },
        ]);

        if (recipe.length > 0) {
            var params = '';
            if (req.query.portion) {
                params += `?portion=${req.query.portion}`;
            }
            if (req.query.form) {
                params += `${!params ? '?' : '&'}form=${req.query.form}`;
            }
            var image = `${process.env.MEDIA_URL}/logo1200.png`;
            if (recipe[0].pictures.length > 0) {
                image = `${process.env.MEDIA_URL}/${recipe[0]._id}.${fileExtension}`;
            }
            res.render('index', {
                title: `${recipe[0].title}`,
                description: `Delucse - ${description}`,
                pictureUrl: image,
                url: process.env.APP_BASE_URL,
                redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}${params}`,
            });
        } else {
            res.render('index', {
                title: `Delucse`,
                description: description,
                pictureUrl: `${process.env.MEDIA_URL}/logo1200.png`,
                url: process.env.APP_BASE_URL,
                redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}`,
            });
        }
    } catch (error) {
        res.render('index', {
            title: `Delucse`,
            description: description,
            pictureUrl: `${process.env.MEDIA_URL}/logo1200.png`,
            url: process.env.APP_BASE_URL,
            redirectUrl: `${process.env.APP_BASE_URL}/rezepte/${id}`,
        });
    }
});

module.exports = api;
