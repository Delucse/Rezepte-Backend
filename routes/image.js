var express = require('express');
var image = express.Router();

const upload = require('../utils/multer');
const imageKit = require('../utils/imageKit');
const sharp = require('sharp');
const { authorization } = require('../helper/authorization');

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const Picture = require('../models/picture');
const Recipe = require('../models/recipe');

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
                    var newPic;
                    const filename = uuidv4() + '.webp';
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        const data = await sharp(req.file.buffer)
                            .webp()
                            .toBuffer();
                        const file = await imageKit.upload({
                            file: data,
                            fileName: filename,
                        });
                        newPic = new Picture({
                            _id: file.fileId,
                            contentType: req.file.mimetype,
                            size: req.file.size,
                            file: file.name,
                            user: req.user.id,
                            recipe: req.params.recipeId,
                        });
                    } else {
                        await sharp(req.file.buffer)
                            .webp()
                            .toFile(
                                `${path.join(
                                    __dirname,
                                    '..',
                                    process.env.MEDIA_PATH || 'public'
                                )}/${filename}`
                            );
                        newPic = new Picture({
                            contentType: req.file.mimetype,
                            size: req.file.size,
                            file: filename,
                            user: req.user.id,
                            recipe: req.params.recipeId,
                        });
                    }
                    const picture = await newPic.save();
                    await Recipe.findByIdAndUpdate(req.params.recipeId, {
                        $push: { pictures: picture._id },
                    });
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
                res.status(400).json({ msg: e.message });
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
                    recipe: {
                        _id: 1,
                        title: 1,
                    },
                },
            },
        ]);
        res.send(image);
    } catch (e) {
        res.status(400).json({ msg: e.message });
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
                    recipe: {
                        _id: 1,
                        title: 1,
                    },
                },
            },
        ]);
        res.send(image);
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

image.delete('/:id', authorization, async (req, res) => {
    const deletedImage = await Picture.findOneAndRemove({
        _id: req.params.id,
        user: req.user.id,
    });
    if (deletedImage) {
        if (process.env.IMAGEKIT_PUBLIC_KEY) {
            try {
                await imageKit.deleteFile(deletedImage._id);
            } catch (err) {
                // images are stored in two different folders: localhost and production
            }
        } else {
            const folder = path.join(
                __dirname,
                '..',
                process.env.MEDIA_PATH || 'public'
            );
            try {
                await fs.unlink(`${folder}/${deletedImage.file}`);
            } catch (err) {
                // images are stored in two different folders: localhost and production
            }
        }
        const recipe = await Recipe.findByIdAndUpdate(deletedImage.recipe, {
            $pull: { pictures: req.params.id },
        });
        res.send({ msg: 'deleted image successfully' });
    } else {
        res.status(400).json({ msg: 'user does not match.' });
    }
});

module.exports = image;
