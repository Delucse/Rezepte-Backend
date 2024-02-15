const Recipe = require('../models/recipe');

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
var chalk = require('chalk');

const axios = require('axios');

const imageKit = require('../utils/imageKit');
const folder = path.join(__dirname, '..', process.env.MEDIA_PATH || 'public');
const fileExtension = 'webp';

sharp.cache(false);

const createPreviews = async () => {
    const recipes = await Recipe.aggregate([
        {
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
        },
        {
            $project: {
                picture: { $arrayElemAt: ['$pictures.file', 0] },
                title: 1,
            },
        },
    ]);

    recipes.forEach(async (recipe) => {
        if (recipe.picture) {
            if (process.env.IMAGEKIT_PUBLIC_KEY) {
                const files = await imageKit.listFiles({
                    searchQuery: `name = "${recipe._id}.${fileExtension}"`,
                });
                if (files.length < 1) {
                    const newfiles = await imageKit.listFiles({
                        searchQuery: `name = "${recipe.picture}"`,
                    });
                    if (newfiles.length > 0) {
                        const img = await axios({
                            url: newfiles[0].url,
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
                            fileName: `${recipe._id}.${fileExtension}`,
                            useUniqueFileName: false,
                        });
                        console.log(
                            chalk.yellow(
                                `fehlende Vorschau für Rezept "${recipe.title}" erstellt`
                            )
                        );
                    }
                }
            } else {
                fs.access(`${folder}/${recipe._id}.${fileExtension}`).catch(
                    async (err) => {
                        await sharp(`${folder}/${recipe.picture}`)
                            .resize({ width: 1200, height: 630, fit: 'cover' })
                            .composite([
                                {
                                    input: `${folder}/logo_256.svg`,
                                    top: 630 - 256 - 50,
                                    left: 1200 - 256 - 50,
                                },
                            ])
                            .toFile(`${folder}/${recipe._id}.${fileExtension}`);
                        console.log(
                            chalk.yellow(
                                `fehlende Vorschau für Rezept "${recipe.title}" erstellt`
                            )
                        );
                    }
                );
            }
        }
    });
};

module.exports = {
    createPreviews,
};
