var express = require('express');
var api = express.Router();

const User = require('../models/user');
const Recipe = require('../models/recipe');
const Picture = require('../models/picture');
const RecipeUser = require('../models/recipeUser');
const RecipePrototpye = require('../models/recipePrototype');

const jwt = require('jsonwebtoken');
const cryptojs = require('crypto-js');

const imageKit = require('../utils/imageKit');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const { authorization, invalidateToken } = require('../helper/authorization');

const { send, email } = require('../utils/emailTransporter');

const unauthorizedUser = require('../templates/unauthorizedUser');
const authorizedUser = require('../templates/authorizedUser');
const queryNewPassword = require('../templates/resetPassword');

const validate = require('../validators/index');
const {
    resetPassword,
    setPassword,
    newPassword,
    deleteUser,
    authorizationValidator,
} = require('../validators/user');

const folder = path.join(__dirname, '..', process.env.MEDIA_PATH || 'public');
const fileExtension = 'webp';

sharp.cache(false);

api.get(
    '/authorization/:token',
    authorizationValidator,
    validate,
    async (req, res) => {
        try {
            const { token } = req.params;

            jwt.verify(
                token,
                process.env.AUTHORIZATION_TOKEN_SECRET,
                async (err, decoded) => {
                    if (err) {
                        return res
                            .status(403)
                            .json({ message: 'token is not valid' });
                    }

                    const user = await User.findOneAndUpdate(
                        {
                            _id: decoded.id,
                            verification: true,
                            authorization: false,
                        },
                        { authorization: true }
                    );

                    if (!user)
                        return res.status(403).json({
                            message:
                                'user does not exist, is not verified or is already authorized',
                        });

                    send(
                        email(
                            user.email,
                            'Nutzerkonto authorisiert',
                            authorizedUser(user.username)
                        )
                    );

                    res.status(200).json({
                        message: 'user is authorized',
                    });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: err.message });
        }
    }
);

api.get(
    '/unauthorization/:token',
    authorizationValidator,
    validate,
    async (req, res) => {
        try {
            const { token } = req.params;

            jwt.verify(
                token,
                process.env.AUTHORIZATION_TOKEN_SECRET,
                async (err, decoded) => {
                    if (err) {
                        return res
                            .status(403)
                            .json({ message: 'token is not valid' });
                    }

                    const user = await User.findOneAndRemove({
                        _id: decoded.id,
                        verification: true,
                        authorization: false,
                    });

                    if (!user)
                        return res.status(403).json({
                            message:
                                'user does not exist, is not verified or is already authorized',
                        });

                    send(
                        email(
                            user.email,
                            'Nutzerkonto nicht authorisiert',
                            unauthorizedUser(user.username)
                        )
                    );

                    res.status(200).json({
                        message: 'user is unauthorized',
                    });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: err.message });
        }
    }
);

api.get('/', authorization, async (req, res) => {
    try {
        // checking if username exists
        const user = await User.findById(req.user.id);

        res.status(200).send({
            username: user.username,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

api.post('/password', resetPassword, validate, async (req, res) => {
    try {
        // checking if user is in db
        const user = await User.findOne({
            $or: [
                {
                    username: {
                        $regex: `^${req.body.username}$`,
                        $options: 'i',
                    },
                },
                { email: req.body.username.toLowerCase() },
            ],
            verification: true,
        });
        if (!user)
            return res.status(200).send({
                message: 'if username exists, then an email was sent',
            });

        const token = jwt.sign(
            { id: user._id },
            process.env.VERIFY_TOKEN_EXPIRATION + user.password,
            {
                expiresIn: Number(process.env.VERIFY_TOKEN_EXPIRATION),
            }
        );

        send(
            email(
                user.email,
                'Passwort zurücksetzen',
                queryNewPassword(user.username, token, user._id)
            )
        );

        res.status(200).json({
            message: 'if user exists, then an email was sent',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

api.put('/password/:id', setPassword, validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(403).json({ message: 'invalid user' });

        jwt.verify(
            req.body.token,
            process.env.VERIFY_TOKEN_EXPIRATION + user.password,
            async (err, decoded) => {
                if (err) {
                    return res
                        .status(403)
                        .json({ message: 'token is not valid' });
                }
                if (decoded.id !== user._id.toHexString())
                    return res.status(403).json({ message: 'invalid user' });

                await User.findOneAndUpdate(
                    { _id: decoded.id },
                    {
                        password: cryptojs.AES.encrypt(
                            req.body.password,
                            process.env.PASSWORD_SECRET
                        ).toString(),
                    }
                );

                res.status(200).json({
                    message: 'password changed',
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

api.put('/password', authorization, newPassword, validate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // checking if password is correct
        const hashedPassword = cryptojs.AES.decrypt(
            user.password,
            process.env.PASSWORD_SECRET
        );
        const validPassword =
            hashedPassword.toString(cryptojs.enc.Utf8) === req.body.oldPassword;

        if (!validPassword)
            return res.status(403).send({ message: 'unauthorized' });

        await User.findOneAndUpdate(
            { _id: req.user.id },
            {
                password: cryptojs.AES.encrypt(
                    req.body.password,
                    process.env.PASSWORD_SECRET
                ).toString(),
            }
        );

        res.status(200).json({
            message: 'password changed',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

api.delete('/', authorization, deleteUser, validate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        // checking if password is correct
        const hashedPassword = cryptojs.AES.decrypt(
            user.password,
            process.env.PASSWORD_SECRET
        );
        const validPassword =
            hashedPassword.toString(cryptojs.enc.Utf8) === req.body.password;

        if (!validPassword)
            return res.status(403).send({ message: 'unauthorized' });

        const deletedRecipes = await Recipe.find({ user: req.user.id });
        await Recipe.deleteMany({
            user: req.user.id,
        });
        if (deletedRecipes) {
            deletedRecipes.forEach(async (deletedRecipe) => {
                try {
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
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        const files = await imageKit.listFiles({
                            searchQuery: `name = "${deletedRecipe._id}.${fileExtension}"`,
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
                            `${folder}/${deletedRecipe._id}.${fileExtension}`
                        );
                    }
                    await RecipeUser.deleteMany({
                        recipe: deletedRecipe._id,
                    });
                } catch (error) {}
            });
        }
        const deletedImages = await Picture.find({ user: req.user.id });
        await Picture.deleteMany({ user: req.user.id });
        if (deletedImages) {
            deletedImages.forEach(async (deletedImage) => {
                try {
                    if (process.env.IMAGEKIT_PUBLIC_KEY) {
                        await imageKit
                            .deleteFile(deletedImage._id)
                            .catch((err) =>
                                console.error(err.message, deletedPicture._id)
                            );
                    } else {
                        await fs.unlink(`${folder}/${deletedImage.file}`);
                    }
                    const recipe = await Recipe.findByIdAndUpdate(
                        deletedImage.recipe,
                        {
                            $pull: { pictures: deletedImage._id },
                        },
                        { new: false }
                    );
                    if (recipe.pictures.length === 1) {
                        if (process.env.IMAGEKIT_PUBLIC_KEY) {
                            const files = await imageKit.listFiles({
                                searchQuery: `name = "${deletedImage.recipe}.${fileExtension}"`,
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
                                `${folder}/${deletedImage.recipe}.${fileExtension}`
                            );
                        }
                    } else if (
                        recipe.pictures.indexOf(deletedImage._id) === 0
                    ) {
                        const newPreview = await Picture.findById(
                            recipe.pictures[1]
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
                                    fileName: `${deletedImage.recipe}.${fileExtension}`,
                                    useUniqueFileName: false,
                                });
                            }
                        } else {
                            await sharp(`${folder}/${newPreview.file}`)
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
                                    `${folder}/${deletedImage.recipe}.${fileExtension}`
                                );
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        }
        await RecipePrototpye.deleteMany({ user: req.user.id });
        await RecipeUser.deleteMany({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        if (req.cookies?.token) {
            res.clearCookie('token', {
                httpOnly: true,
                sameSite: 'None',
                secure: true,
            });
        }
        res.send({ msg: 'deleted user successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
