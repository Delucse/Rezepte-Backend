var express = require('express');
var image = express.Router();

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const { authorization } = require('../helper/authorization');

const path = require('path');
const fs = require('fs');

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
                    const file = await cloudinary.uploader.upload(
                        req.file.path
                    );
                    var newPic = new Picture({
                        contentType: req.file.mimetype,
                        size: req.file.size,
                        file: file.public_id,
                        user: req.user.id,
                        recipe: req.params.recipeId,
                    });
                    const picture = await newPic.save().then((pic) => pic._id); // return the promise without calling it yet
                    await Recipe.findByIdAndUpdate(req.params.recipeId, {
                        $push: { pictures: picture },
                    });
                    res.send({
                        msg: 'added recipe image successfully',
                        image: {
                            _id: picture,
                            file: req.file.filename,
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

image.get('/', authorization, async (req, res) => {
    try {
        const image = await Picture.aggregate([
            {
                $match: { user: req.user.id },
            },
            {
                $lookup: {
                    from: 'recipes',
                    localField: 'recipe',
                    foreignField: '_id',
                    let: { imageId: '$$ROOT._id' },
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                index: {
                                    $indexOfArray: ['$pictures', '$$imageId'],
                                },
                            },
                        },
                    ],
                    as: 'recipe',
                },
            },
            { $sort: { 'recipe.title': 1, 'recipe.index': 1 } },
            {
                $project: {
                    _id: 1,
                    file: 1,
                    recipe: { $arrayElemAt: ['$recipe', 0] },
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
        // const folder = path.join(__dirname, '..', '/public');
        try {
            await cloudinary.uploader.destroy(deletedImage.file);
            // fs.unlinkSync(`${folder}/${deletedImage.file}`);
        } catch (err) {
            // images are stored in two different folders: localhost and production
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
