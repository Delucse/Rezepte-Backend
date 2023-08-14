var express = require('express');
var image = express.Router();

const upload = require('../utils/multer');
const sharp = require('sharp');
const { authorization } = require('../helper/authorization');

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const Picture = require('../models/picture');
const Recipe = require('../models/recipe');

const folder = path.join(__dirname, '..', process.env.MEDIA_PATH || 'public');
const fileExtension = 'webp';

sharp.cache(false);

image.post('/:recipeId', authorization, (req, res) => {
    upload.single('picture')(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                // 'File too large'
                return res.send('Bilder-Datei ist zu groß.');
            } else {
                return res.send(err);
            }
        } else {
            try {
                if (req.file) {
                    const fileName = uuidv4();
                    const pic = await sharp(req.file.buffer)
                        .webp()
                        .toFile(`${folder}/${fileName}.${fileExtension}`);
                    var newPic = new Picture({
                        contentType: `image/${pic.format}`,
                        size: pic.size,
                        file: `${fileName}.${fileExtension}`,
                        user: req.user.id,
                        recipe: req.params.recipeId,
                    });
                    const picture = await newPic.save();
                    const recipe = await Recipe.findByIdAndUpdate(
                        req.params.recipeId,
                        {
                            $push: { pictures: picture._id },
                        },
                        { new: false }
                    );
                    if (recipe.pictures.length === 0) {
                        await sharp(`${folder}/${fileName}.${fileExtension}`)
                            .resize({ width: 1200, height: 630, fit: 'cover' })
                            .composite([
                                {
                                    input: `${folder}/logo_256.svg`,
                                    top: 630 - 256 - 50,
                                    left: 1200 - 256 - 50,
                                },
                            ])
                            .toFile(
                                `${folder}/${req.params.recipeId}.${fileExtension}`
                            );
                    }
                    res.send({
                        msg: 'added recipe image successfully',
                        image: {
                            _id: picture._id,
                            file: picture.file,
                            user: req.user.username,
                        },
                    });
                } else {
                    res.status(400).json({ msg: 'No image' });
                }
            } catch (e) {
                console.error(e.message);
                res.status(500).json({ msg: e.message });
            }
        }
    });
});

image.get('/', async (req, res) => {
    try {
        const image = await Picture.aggregate([
            {
                $lookup: {
                    from: 'recipes',
                    localField: 'recipe',
                    foreignField: '_id',
                    as: 'recipe',
                },
            },
            { $addFields: { recipe: { $first: '$recipe' } } },
            { $sort: { createdAt: -1 } },
            {
                $limit:
                    req.query.limit &&
                    !isNaN(req.query.limit) &&
                    req.query.limit <= 10
                        ? Number(req.query.limit)
                        : 10,
            },
            {
                $project: {
                    _id: 1,
                    file: 1,
                    date: '$createdAt',
                    recipe: {
                        _id: 1,
                        title: 1,
                    },
                },
            },
        ]);
        res.send(image);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

image.get('/user', authorization, async (req, res) => {
    try {
        const image = await Picture.aggregate([
            { $match: { user: req.user.id } },
            {
                $lookup: {
                    from: 'recipes',
                    localField: 'recipe',
                    foreignField: '_id',
                    as: 'recipe',
                },
            },
            { $addFields: { recipe: { $first: '$recipe' } } },
            {
                $set: {
                    index: {
                        $indexOfArray: ['$recipe.pictures', '$$ROOT._id'],
                    },
                },
            },
            { $sort: { 'recipe.title': 1, index: 1 } },
            {
                $project: {
                    _id: 1,
                    file: 1,
                    date: '$createdAt',
                    recipe: {
                        _id: 1,
                        title: 1,
                    },
                },
            },
        ]);
        res.send(image);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

image.delete('/:id', authorization, async (req, res) => {
    try {
        const deletedImage = await Picture.findOneAndRemove({
            _id: req.params.id,
            user: req.user.id,
        });
        if (deletedImage) {
            try {
                await fs.unlink(`${folder}/${deletedImage.file}`);
            } catch (err) {
                console.error(err);
            }
            const recipe = await Recipe.findByIdAndUpdate(
                deletedImage.recipe,
                {
                    $pull: { pictures: req.params.id },
                },
                { new: false }
            );
            try {
                if (recipe.pictures.length === 1) {
                    await fs.unlink(
                        `${folder}/${deletedImage.recipe}.${fileExtension}`
                    );
                } else if (recipe.pictures.indexOf(req.params.id) === 0) {
                    const newPreview = await Picture.findById(
                        recipe.pictures[1]
                    );
                    await sharp(`${folder}/${newPreview.file}`)
                        .resize({ width: 1200, height: 630, fit: 'cover' })
                        .composite([
                            {
                                input: `${folder}/logo_256.svg`,
                                top: 630 - 256 - 50,
                                left: 1200 - 256 - 50,
                            },
                        ])
                        .toFile(
                            `${folder}/${deletedImage.recipe}.${fileExtension}`
                        );
                }
            } catch (err) {
                console.error(err);
            }
            res.send({ msg: 'deleted image successfully' });
        } else {
            res.status(400).json({ msg: 'user does not match.' });
        }
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

module.exports = image;
