var express = require('express');
var recipe = express.Router();

const { upload } = require('../helper/uploadImages');
const { authorization, getUser } = require('../helper/authorization');

const path = require('path');
const fs = require('fs');

const mongoose = require('mongoose');
const Picture = require('../models/picture');
const Recipe = require('../models/recipe');
const User = require('../models/user');

recipe.post('/', authorization, (req, res) => {
    upload.array('pictures')(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                // 'File too large'
                return res.send('Mind. eine Bilder-Datei ist zu groß.');
            } else {
                return res.send(err);
            }
        } else {
            try {
                const {
                    title,
                    source,
                    portion,
                    time,
                    keywords,
                    ingredients,
                    steps,
                } = req.body;
                const recipeId = mongoose.Types.ObjectId();
                var newRecipe = {
                    _id: recipeId,
                    title,
                    source,
                    portion,
                    time,
                    keywords,
                    ingredients,
                    steps,
                    user: req.user.id,
                };
                if (req.files) {
                    const promises = req.files.map((file) => {
                        var newPic = new Picture({
                            contentType: file.mimetype,
                            size: file.size,
                            file: file.filename,
                            user: req.user.id,
                            recipe: recipeId,
                        });
                        return newPic.save().then((pic) => pic._id); // return the promise without calling it yet
                    });
                    const pictures = await Promise.all(promises);
                    newRecipe.pictures = pictures;
                }
                await new Recipe(newRecipe).save();
                res.send({ msg: 'created recipe successfully', id: recipeId });
            } catch (e) {
                res.status(400).json({ msg: e.message });
            }
        }
    });
});

recipe.put('/:id', authorization, (req, res) => {
    upload.array('pictures')(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                // 'File too large'
                return res.send('Mind. eine Bilder-Datei ist zu groß.');
            } else {
                return res.send(err);
            }
        } else {
            try {
                var {
                    title,
                    source,
                    portion,
                    time,
                    keywords,
                    ingredients,
                    steps,
                    removedPictures,
                    picturesOrder,
                } = req.body;
                var newRecipe = {
                    title,
                    source,
                    portion,
                    time,
                    keywords,
                    ingredients,
                    steps,
                };
                var pictureIds = [];
                if (req.files) {
                    const promises = req.files.map((file) => {
                        var newPic = new Picture({
                            contentType: file.mimetype,
                            size: file.size,
                            file: file.filename,
                            user: req.user.id,
                            recipe: req.params.id,
                        });
                        return newPic.save().then((pic) => pic._id); // return the promise without calling it yet
                    });
                    const pictures = await Promise.all(promises);
                    pictureIds = pictures;
                }
                if (removedPictures && removedPictures.length > 0) {
                    const folder = path.join(__dirname, '..', '/public');
                    removedPictures.forEach(async (pic) => {
                        const deletedPicture = await Picture.findOneAndRemove({
                            _id: pic,
                            user: req.user.id,
                        });
                        if (deletedPicture) {
                            fs.unlinkSync(`${folder}/${deletedPicture.file}`);
                        }
                    });
                }
                if (picturesOrder) {
                    if (pictureIds.length > 0) {
                        pictureIds.forEach((id) => {
                            picturesOrder[
                                picturesOrder.findIndex(
                                    (elem) => elem === 'undefined'
                                )
                            ] = id;
                        });
                    }
                    newRecipe.pictures = picturesOrder;
                }

                await Recipe.updateOne(
                    { _id: req.params.id },
                    { $set: newRecipe, $inc: { updates: 1 } }
                );
                res.send({
                    msg: 'updated recipe successfully',
                    id: req.params.id,
                });
            } catch (e) {
                res.status(400).json({ msg: e.message });
            }
        }
    });
});

recipe.delete('/:id', authorization, async (req, res) => {
    const deletedRecipe = await Recipe.findOneAndRemove({
        _id: req.params.id,
        user: req.user.id,
    });
    if (deletedRecipe) {
        const folder = path.join(__dirname, '..', '/public');
        deletedRecipe.pictures.forEach(async (picId) => {
            const deletedPicture = await Picture.findOneAndRemove({
                _id: picId,
                user: req.user.id,
            });
            if (deletedPicture) {
                fs.unlinkSync(`${folder}/${deletedPicture.file}`);
            }
        });
        res.send({ msg: 'deleted recipe successfully' });
    } else {
        res.status(400).json({ msg: 'user does not match.' });
    }
});

const createSearchAggregate = async (
    { search, type, keywords, sort, ascending },
    user,
    match
) => {
    const aggregate = [];

    if (user) {
        const favorites = await User.findById(user).then(
            (res) => res.favorites
        );
        aggregate.push({ $set: { favorite: { $in: ['$_id', favorites] } } });
    } else {
        aggregate.push({ $set: { favorite: false } });
    }

    if (search) {
        var score = 1;
        if (type && type !== 'all') {
            if (type === 'ingredients') {
                aggregate.push({ $unwind: '$ingredients' });
                aggregate.push({
                    $set: {
                        ingredients: {
                            $reduce: {
                                input: '$ingredients.food.aliment',
                                initialValue: '',
                                in: { $concat: ['$$value', '$$this'] },
                            },
                        },
                    },
                });
            } else if (type === 'keywords') {
                type = 'keys';
                aggregate.push({
                    $set: {
                        keys: {
                            $reduce: {
                                input: '$keywords',
                                initialValue: '',
                                in: { $concat: ['$$value', '$$this'] },
                            },
                        },
                    },
                });
            } else if (type === 'steps') {
                aggregate.push({ $unwind: '$steps' });
            }
            search = search
                .replaceAll(/(\s*(,|;)\s*|\s+)/gi, ' ')
                .replace(/\s$/, '')
                .split(' ');
            var scoreRegEx = search.map((search) => {
                return {
                    $size: {
                        $regexFindAll: {
                            input: `$${type}`,
                            regex: search,
                            options: 'i',
                        },
                    },
                };
            });
            if (match) {
                aggregate.push({ $match: match });
            }
            aggregate.push({ $set: { score: { $sum: scoreRegEx } } });
            aggregate.push({ $match: { score: { $gt: 0 } } });
        } else {
            if (match) {
                aggregate.push({
                    $match: { $and: [match, { $text: { $search: search } }] },
                });
            } else {
                aggregate.push({ $match: { $text: { $search: search } } });
            }
            score = { $meta: 'textScore' }; // default value for search term
        }
    } else {
        if (match) {
            aggregate.push({ $match: match });
        }
        sort = 'title'; // default sort for no search term
    }

    if (keywords) {
        keywords = keywords
            .replaceAll(/(\s*(,|;)\s*|\s+)/gi, ',')
            .replace(/,$/, '')
            .split(',');
        var keywordsRegEx = keywords.map((key) => {
            return { keywords: { $regex: key, $options: 'i' } };
        });
        aggregate.push({ $match: { $and: keywordsRegEx } });
    }

    aggregate.push({
        $set: {
            time: {
                $add: ['$time.preparation', '$time.resting', '$time.baking'],
            },
        },
    });
    aggregate.push({
        $lookup: {
            from: 'pictures',
            localField: 'pictures',
            foreignField: '_id',
            as: 'pictures',
        },
    }); // populate('pictures', 'file');

    if (sort) {
        if (sort === 'title') {
            sort = 'lowerTitle';
            aggregate.push({ $set: { lowerTitle: { $toLower: '$title' } } }); // collation does also the trick
        }
    } else {
        sort = 'score'; // default value
    }

    if (ascending && ascending === 'false') {
        ascending = -1;
    } else {
        ascending = 1;
    }

    aggregate.push({ $sort: { [sort]: ascending, _id: ascending } });
    aggregate.push({
        $project: {
            title: 1,
            picture: { $arrayElemAt: ['$pictures.file', 0] },
            time: 1,
            keywords: 1,
            favorite: 1,
            date: '$createdAt',
            score: score,
        },
    });

    return aggregate;
};

recipe.get('/', getUser, async (req, res) => {
    try {
        const aggregate = await createSearchAggregate(
            req.query,
            req.user && req.user.id
        );
        const recipes = await Recipe.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

recipe.get('/user', authorization, async (req, res) => {
    try {
        const match = { user: req.user.id };
        const aggregate = await createSearchAggregate(
            req.query,
            req.user.id,
            match
        );
        const recipes = await Recipe.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

recipe.get('/favorite', authorization, async (req, res) => {
    try {
        const match = { favorite: true };
        const aggregate = await createSearchAggregate(
            req.query,
            req.user.id,
            match
        );
        const recipes = await Recipe.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

recipe.get('/:id', getUser, async (req, res) => {
    try {
        const aggregate = [];
        aggregate.push({
            $match: { _id: mongoose.Types.ObjectId(req.params.id) },
        });
        if (req.user) {
            const favorites = await User.findById(req.user.id).then(
                (res) => res.favorites
            );
            aggregate.push({
                $set: { favorite: { $in: ['$_id', favorites] } },
            });
        } else {
            aggregate.push({ $set: { favorite: false } });
        }
        aggregate.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 0, username: 1 } }],
                as: 'user',
            },
        }); // populate('pictures', 'file');
        aggregate.push({
            $lookup: {
                from: 'pictures',
                localField: 'pictures',
                foreignField: '_id',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            pipeline: [{ $project: { _id: 0, username: 1 } }],
                            as: 'user',
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            file: 1,
                            user: { $arrayElemAt: ['$user.username', 0] },
                        },
                    },
                ],
                as: 'pictures',
            },
        });
        aggregate.push({
            $project: {
                title: 1,
                user: { $arrayElemAt: ['$user.username', 0] },
                portion: 1,
                source: 1,
                pictures: 1,
                time: 1,
                keywords: 1,
                ingredients: 1,
                steps: 1,
                updates: 1,
                favorite: 1,
                date: '$createdAt',
            },
        });

        const recipe = await Recipe.aggregate(aggregate);
        if (recipe.length > 0) {
            res.send(recipe[0]);
        } else {
            res.status(400).send({ msg: 'Recipe not available.' });
        }
    } catch (e) {
        res.status(400).json({ msg: e.message });
    }
});

recipe.post('/:recipeId/image', authorization, (req, res) => {
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
                    var newPic = new Picture({
                        contentType: req.file.mimetype,
                        size: req.file.size,
                        file: req.file.filename,
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

module.exports = recipe;
