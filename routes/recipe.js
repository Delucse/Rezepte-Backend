var express = require('express');
var recipe = express.Router();

const upload = require('../utils/multer');
const sharp = require('sharp');
const { authorization, getUser } = require('../helper/authorization');

const axios = require('axios');

const imageKit = require('../utils/imageKit');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const mongoose = require('mongoose');
const Picture = require('../models/picture');
const Recipe = require('../models/recipe');
const User = require('../models/user');
const RecipeUser = require('../models/recipeUser');
const RecipePrototpye = require('../models/recipePrototype');

const folder = path.join(__dirname, '..', process.env.MEDIA_PATH || 'public');
const fileExtension = 'webp';

sharp.cache(false);

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
                    portion,
                    time,
                    credits,
                    keywords,
                    ingredients,
                    steps,
                    prototype,
                } = req.body;
                const recipeId = mongoose.Types.ObjectId();
                var newRecipe = {
                    _id: recipeId,
                    title,
                    portion,
                    time,
                    credits,
                    keywords,
                    ingredients,
                    steps,
                    user: req.user.id,
                };
                if (req.files) {
                    const promises = req.files.map(async (file, index) => {
                        const fileName = uuidv4();
                        var newPic;
                        if (process.env.IMAGEKIT_PUBLIC_KEY) {
                            const data = await sharp(file.buffer)
                                .webp()
                                .toBuffer();
                            const uFile = await imageKit.upload({
                                file: data,
                                fileName: `${fileName}.${fileExtension}`,
                                useUniqueFileName: false,
                            });
                            newPic = new Picture({
                                _id: uFile.fileId,
                                contentType: `image/${fileExtension}`,
                                size: uFile.size,
                                file: uFile.name,
                                user: req.user.id,
                                recipe: recipeId,
                            });
                        } else {
                            const pic = await sharp(file.buffer)
                                .webp()
                                .toFile(
                                    `${folder}/${fileName}.${fileExtension}`
                                );
                            newPic = new Picture({
                                contentType: `image/${pic.format}`,
                                size: pic.size,
                                file: `${fileName}.${fileExtension}`,
                                user: req.user.id,
                                recipe: recipeId,
                            });
                        }
                        if (index === 0) {
                            if (process.env.IMAGEKIT_PUBLIC_KEY) {
                                const data = await sharp(file.buffer)
                                    .webp()
                                    .resize({
                                        width: 1200,
                                        height: 630,
                                        fit: 'cover',
                                    })
                                    .composite([
                                        {
                                            input: `${folder}/logo_256.svg`,
                                            top: 630 - 256 - 50,
                                            left: 1200 - 256 - 50,
                                        },
                                    ])
                                    .toBuffer();
                                await imageKit.upload({
                                    file: data,
                                    fileName: `${recipeId}.${fileExtension}`,
                                    useUniqueFileName: false,
                                });
                            } else {
                                await sharp(
                                    `${folder}/${fileName}.${fileExtension}`
                                )
                                    .resize({
                                        width: 1200,
                                        height: 630,
                                        fit: 'cover',
                                    })
                                    .composite([
                                        {
                                            input: `${folder}/logo_256.svg`,
                                            top: 630 - 256 - 50,
                                            left: 1200 - 256 - 50,
                                        },
                                    ])
                                    .toFile(
                                        `${folder}/${recipeId}.${fileExtension}`
                                    );
                            }
                        }
                        return newPic.save().then((pic) => pic._id); // return the promise without calling it yet
                    });
                    const pictures = await Promise.all(promises);
                    newRecipe.pictures = pictures;
                }
                await new Recipe(newRecipe).save();
                if (prototype) {
                    await RecipePrototpye.findOneAndRemove({ _id: prototype });
                }
                res.send({ msg: 'created recipe successfully', id: recipeId });
            } catch (e) {
                console.error(e.message);
                res.status(500).json({ msg: e.message });
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
                    portion,
                    time,
                    credits,
                    keywords,
                    ingredients,
                    steps,
                    removedPictures,
                    picturesOrder,
                    prototype,
                } = req.body;
                var newRecipe = {
                    title,
                    portion,
                    time,
                    keywords,
                    ingredients,
                    steps,
                };
                var pictureIds = [];
                if (req.files) {
                    const promises = req.files.map(async (file) => {
                        const fileName = uuidv4();
                        var newPic;
                        if (process.env.IMAGEKIT_PUBLIC_KEY) {
                            const data = await sharp(file.buffer)
                                .webp()
                                .toBuffer();
                            const uFile = await imageKit.upload({
                                file: data,
                                fileName: `${fileName}.${fileExtension}`,
                                useUniqueFileName: false,
                            });
                            newPic = new Picture({
                                _id: uFile.fileId,
                                contentType: `image/${fileExtension}`,
                                size: uFile.size,
                                file: uFile.name,
                                user: req.user.id,
                                recipe: req.params.id,
                            });
                        } else {
                            const pic = await sharp(file.buffer)
                                .webp()
                                .toFile(
                                    `${folder}/${fileName}.${fileExtension}`
                                );
                            newPic = new Picture({
                                contentType: `image/${pic.format}`,
                                size: pic.size,
                                file: `${fileName}.${fileExtension}`,
                                user: req.user.id,
                                recipe: req.params.id,
                            });
                        }
                        return newPic.save().then((pic) => pic._id); // return the promise without calling it yet
                    });
                    const pictures = await Promise.all(promises);
                    pictureIds = pictures;
                }
                if (removedPictures && removedPictures.length > 0) {
                    removedPictures.forEach(async (pic) => {
                        const deletedPicture = await Picture.findOneAndRemove({
                            _id: pic,
                            user: req.user.id,
                        });
                        if (deletedPicture) {
                            if (process.env.IMAGEKIT_PUBLIC_KEY) {
                                await imageKit
                                    .deleteFile(deletedPicture._id)
                                    .catch((err) =>
                                        console.error(
                                            err.message,
                                            deletedPicture._id
                                        )
                                    );
                            } else {
                                await fs.unlink(
                                    `${folder}/${deletedPicture.file}`
                                );
                            }
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
                const unset = {};
                if (credits) {
                    newRecipe.credits = credits;
                } else {
                    unset.credits = 1;
                }
                const oldRecipe = await Recipe.findByIdAndUpdate(
                    req.params.id,
                    { $set: newRecipe, $unset: unset, $inc: { updates: 1 } },
                    { new: false }
                );
                if (prototype) {
                    await RecipePrototpye.findOneAndRemove({ _id: prototype });
                }
                if (
                    removedPictures &&
                    oldRecipe.pictures.length === removedPictures.length
                ) {
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        const files = await imageKit.listFiles({
                            searchQuery: `name = "${req.params.id}.${fileExtension}"`,
                        });
                        if (files.length > 0) {
                            await imageKit
                                .deleteFile(files[0].fileId)
                                .catch((err) =>
                                    console.error(
                                        err.message,
                                        deletedPicture._id
                                    )
                                );
                        }
                    } else {
                        await fs.unlink(
                            `${folder}/${req.params.id}.${fileExtension}`
                        );
                    }
                }
                if (
                    newRecipe.pictures &&
                    newRecipe.pictures.length > 0 &&
                    (oldRecipe.pictures.length === 0 ||
                        oldRecipe.pictures[0] !== newRecipe.pictures[0])
                ) {
                    const newPreview = await Picture.findById(
                        newRecipe.pictures[0]
                    );
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        const files = await imageKit.listFiles({
                            searchQuery: `name = "${newPreview.file}"`,
                        });
                        if (files.length > 0) {
                            const img = await axios({
                                url: files[0].url,
                                responseType: 'arraybuffer',
                            });
                            const data = await sharp(img.data)
                                .webp()
                                .resize({
                                    width: 1200,
                                    height: 630,
                                    fit: 'cover',
                                })
                                .composite([
                                    {
                                        input: `${folder}/logo_256.svg`,
                                        top: 630 - 256 - 50,
                                        left: 1200 - 256 - 50,
                                    },
                                ])
                                .toBuffer();
                            await imageKit.upload({
                                file: data,
                                fileName: `${req.params.id}.${fileExtension}`,
                                useUniqueFileName: false,
                            });
                        }
                    } else {
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
                                `${folder}/${req.params.id}.${fileExtension}`
                            );
                    }
                }
                res.send({
                    msg: 'updated recipe successfully',
                    id: req.params.id,
                });
            } catch (e) {
                console.error(e.message);
                res.status(500).json({ msg: e.message });
            }
        }
    });
});

recipe.delete('/:id', authorization, async (req, res) => {
    try {
        const deletedRecipe = await Recipe.findOneAndRemove({
            _id: req.params.id,
            user: req.user.id,
        });
        if (deletedRecipe) {
            deletedRecipe.pictures.forEach(async (picId) => {
                const deletedPicture = await Picture.findOneAndRemove({
                    _id: picId,
                    user: req.user.id,
                });
                if (deletedPicture) {
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        await imageKit
                            .deleteFile(deletedPicture._id)
                            .catch((err) =>
                                console.error(err.message, deletedPicture._id)
                            );
                    } else {
                        await fs.unlink(`${folder}/${deletedPicture.file}`);
                    }
                }
            });
            if (process.env.IMAGEKIT_PUBLIC_KEY) {
                const files = await imageKit.listFiles({
                    searchQuery: `name = "${deletedRecipe._id}.${fileExtension}"`,
                });
                if (files.length > 0) {
                    await imageKit
                        .deleteFile(files[0].fileId)
                        .catch((err) =>
                            console.error(err.message, deletedPicture._id)
                        );
                }
            } else {
                await fs.unlink(
                    `${folder}/${deletedRecipe._id}.${fileExtension}`
                );
            }
            await RecipeUser.deleteMany({
                recipe: deletedRecipe._id,
            });
            res.send({ msg: 'deleted recipe successfully' });
        } else {
            res.status(400).json({ msg: 'user does not match.' });
        }
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

const createSearchAggregate = async (
    { search, type, keywords, sort, ascending, limit, author, prototype },
    user,
    match
) => {
    const aggregate = [];

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
                aggregate.push({
                    $set: {
                        steps: {
                            $reduce: {
                                input: '$steps',
                                initialValue: '',
                                in: { $concat: ['$$value', '$$this'] },
                            },
                        },
                    },
                });
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
            aggregate.push({ $set: { score: { $sum: scoreRegEx } } });
            aggregate.push({ $match: { score: { $gt: 0 } } });
            if (type === 'ingredients') {
                aggregate.push({
                    $group: {
                        _id: '$_id',
                        user: {
                            $first: '$user',
                        },
                        title: {
                            $first: '$title',
                        },
                        time: {
                            $first: '$time',
                        },
                        keywords: {
                            $first: '$keywords',
                        },
                        pictures: {
                            $first: '$pictures',
                        },
                        score: {
                            $sum: '$score',
                        },
                    },
                });
            }
        } else {
            aggregate.push({ $match: { $text: { $search: search } } });
            score = { $meta: 'textScore' }; // default value for search term
        }
    } else if (sort === 'score') {
        // default sort for no search term and sort = score
        sort = 'title';
        ascending = true;
    }

    if (author) {
        const users = await User.find({
            username: { $regex: author, $options: 'i' },
        }).then((res) => res.map((u) => u._id));
        aggregate.push({
            $match: { user: { $in: users } },
        });
    }

    if (user) {
        const favorites = await RecipeUser.find({
            user: user,
            favorite: true,
        }).then((res) => res.map((f) => f.recipe));
        aggregate.push({ $set: { favorite: { $in: ['$_id', favorites] } } });
    } else {
        aggregate.push({ $set: { favorite: false } });
    }

    if (match) {
        aggregate.push({ $match: match });
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

    if (!prototype) {
        aggregate.push({
            $set: {
                time: {
                    $add: [
                        '$time.preparation',
                        '$time.resting',
                        '$time.baking',
                    ],
                },
            },
        });
    }

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
    }); // populate('pictures', 'file');

    if (ascending && ascending === 'false') {
        ascending = -1;
    } else {
        ascending = 1;
    }

    switch (sort) {
        case 'score':
            if (type !== 'all') {
                sort = { score: ascending };
            } else {
                sort = { score: { $meta: 'textScore' } };
            }
            break;
        case 'title':
            aggregate.push({ $set: { lowerTitle: { $toLower: '$title' } } }); // collation does also the trick
            sort = { lowerTitle: ascending };
            break;
        case 'time':
            sort = { time: ascending };
            break;
        case 'date':
            sort = { createdAt: ascending };
            break;
        default:
            if (type !== 'all') {
                sort = { score: ascending };
            } else {
                sort = { score: { $meta: 'textScore' } };
            }
    }

    aggregate.push({ $sort: { ...sort, _id: ascending } });

    if (limit && !isNaN(limit)) {
        aggregate.push({ $limit: Number(limit) });
    }

    const project = {
        title: 1,
        picture: { $arrayElemAt: ['$pictures.file', 0] },
        time: 1,
        keywords: 1,
        favorite: 1,
        date: '$createdAt',
        score: score,
    };
    if (!prototype) {
        project.time = 1;
    }
    aggregate.push({
        $project: project,
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
        res.status(200).send(recipes);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.get('/baby', getUser, async (req, res) => {
    try {
        const match = { keywords: { $regex: 'baby', $options: 'i' } };
        const aggregate = await createSearchAggregate(
            req.query,
            req.user && req.user.id,
            match
        );
        const recipes = await Recipe.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.get('/basic', getUser, async (req, res) => {
    try {
        const match = { keywords: { $regex: 'basic', $options: 'i' } };
        const aggregate = await createSearchAggregate(
            req.query,
            req.user && req.user.id,
            match
        );
        const recipes = await Recipe.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
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
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.get('/prototype', authorization, async (req, res) => {
    try {
        const match = { user: req.user.id };
        const aggregate = await createSearchAggregate(
            { ...req.query, prototype: true },
            req.user.id,
            match
        );
        const recipes = await RecipePrototpye.aggregate(aggregate);
        res.send(recipes);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
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
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.get('/:id', getUser, async (req, res) => {
    try {
        const aggregate = [];
        aggregate.push({
            $match: { _id: mongoose.Types.ObjectId(req.params.id) },
        });
        if (req.user) {
            const info = await RecipeUser.findOne({
                user: req.user.id,
                recipe: req.params.id,
            });
            aggregate.push({
                $set: { favorite: info ? info.favorite : false },
            });
            aggregate.push({
                $set: { note: info ? info.note : '' },
            });
            aggregate.push({
                $lookup: {
                    from: 'recipeprototypes',
                    let: { recipe: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$recipe', '$$recipe'] },
                            },
                        },
                        { $project: { _id: 1 } },
                    ],
                    as: 'prototype',
                },
            });
        }
        aggregate.push({
            $lookup: {
                from: 'users',
                let: { user: '$user' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$user'] },
                        },
                    },
                    { $project: { _id: 0, username: 1 } },
                ],
                as: 'user',
            },
        });
        aggregate.push({
            $lookup: {
                from: 'pictures',
                let: { pictureArray: '$pictures' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ['$_id', '$$pictureArray'] },
                        },
                    },
                    {
                        $addFields: {
                            sort: {
                                $indexOfArray: ['$$pictureArray', '$_id'],
                            },
                        },
                    },
                    { $sort: { sort: 1 } },
                    {
                        $lookup: {
                            from: 'users',
                            let: { user: '$user' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ['$_id', '$$user'] },
                                    },
                                },
                                { $project: { _id: 0, username: 1 } },
                            ],
                            as: 'user',
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            file: 1,
                            user: { $arrayElemAt: ['$user.username', 0] },
                            date: '$createdAt',
                        },
                    },
                ],
                as: 'pictures',
            },
        });
        const project = {
            title: 1,
            user: { $arrayElemAt: ['$user.username', 0] },
            portion: 1,
            pictures: 1,
            time: 1,
            credits: 1,
            keywords: 1,
            ingredients: 1,
            steps: 1,
            updates: 1,
            date: '$createdAt',
        };
        if (req.user) {
            project.favorite = 1;
            project.note = 1;
            project.prototype = { $arrayElemAt: ['$prototype._id', 0] };
        }
        aggregate.push({
            $project: project,
        });

        const recipe = await Recipe.aggregate(aggregate);
        if (recipe.length > 0) {
            res.send(recipe[0]);
        } else {
            res.status(400).send({ msg: 'Recipe not available.' });
        }
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.post('/prototype', authorization, async (req, res) => {
    try {
        const {
            id,
            title,
            portion,
            time,
            credits,
            keywords,
            ingredients,
            steps,
        } = req.body;
        var newRecipe = {
            recipe: id,
            title,
            portion,
            time,
            credits,
            keywords,
            ingredients,
            steps,
            user: req.user.id,
        };
        const prototype = await RecipePrototpye.findOneAndUpdate(
            id ? { recipe: id } : { _id: mongoose.Types.ObjectId() },
            newRecipe,
            {
                upsert: true,
                new: true,
            }
        );
        res.send({
            msg: 'created recipe prototype successfully',
            id: prototype._id,
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.put('/prototype/:id', authorization, async (req, res) => {
    try {
        var { title, portion, time, credits, keywords, ingredients, steps } =
            req.body;
        var newRecipe = {
            title,
            portion,
            time,
            keywords,
            ingredients,
            steps,
        };
        const unset = {};
        if (credits) {
            newRecipe.credits = credits;
        } else {
            unset.credits = 1;
        }
        await RecipePrototpye.updateOne(
            { _id: req.params.id },
            { $set: newRecipe, $unset: unset, $inc: { updates: 1 } }
        );
        res.send({
            msg: 'updated recipe prototype successfully',
            id: req.params.id,
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.delete('/prototype/:id', authorization, async (req, res) => {
    try {
        const deletedRecipe = await RecipePrototpye.findOneAndRemove({
            _id: req.params.id,
            user: req.user.id,
        });
        if (deletedRecipe) {
            res.send({ msg: 'deleted recipe prototype successfully' });
        } else {
            res.status(400).json({ msg: 'user does not match.' });
        }
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

recipe.get('/prototype/:id', authorization, async (req, res) => {
    try {
        const aggregate = [];
        aggregate.push({
            $match: { _id: mongoose.Types.ObjectId(req.params.id) },
        });
        aggregate.push({
            $lookup: {
                from: 'users',
                let: { user: '$user' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$user'] },
                        },
                    },
                    { $project: { _id: 0, username: 1 } },
                ],
                as: 'user',
            },
        });
        aggregate.push({
            $lookup: {
                from: 'recipes',
                let: { recipeId: '$recipe' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$recipeId'] },
                        },
                    },
                    { $project: { pictures: 1 } },
                    {
                        $lookup: {
                            from: 'pictures',
                            let: { pictureArray: '$pictures' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: ['$_id', '$$pictureArray'],
                                        },
                                    },
                                },
                                {
                                    $addFields: {
                                        sort: {
                                            $indexOfArray: [
                                                '$$pictureArray',
                                                '$_id',
                                            ],
                                        },
                                    },
                                },
                                { $sort: { sort: 1 } },
                                {
                                    $lookup: {
                                        from: 'users',
                                        let: { user: '$user' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$_id', '$$user'],
                                                    },
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 0,
                                                    username: 1,
                                                },
                                            },
                                        ],
                                        as: 'user',
                                    },
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        file: 1,
                                        user: {
                                            $arrayElemAt: ['$user.username', 0],
                                        },
                                        date: '$createdAt',
                                    },
                                },
                            ],
                            as: 'pictures',
                        },
                    },
                ],
                as: 'pictures',
            },
        });
        aggregate.push({
            $project: {
                recipe: 1,
                title: 1,
                user: { $arrayElemAt: ['$user.username', 0] },
                portion: 1,
                pictures: { $arrayElemAt: ['$pictures.pictures', 0] },
                time: 1,
                credits: 1,
                keywords: 1,
                ingredients: 1,
                steps: 1,
                updates: 1,
                date: '$createdAt',
            },
        });

        const prototype = await RecipePrototpye.aggregate(aggregate);
        if (prototype.length > 0) {
            prototype[0].pictures = prototype[0].pictures
                ? prototype[0].pictures
                : [];
            prototype[0].ingredients = prototype[0].ingredients.map((i) => {
                i.food.map((f) => {
                    f.amount === null ? (f.amount = '') : f.amount;
                    return f;
                });
                return i;
            });
            res.send(prototype[0]);
        } else {
            res.status(400).send({
                msg: 'Recipe Prototype not available.',
            });
        }
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ msg: e.message });
    }
});

module.exports = recipe;
