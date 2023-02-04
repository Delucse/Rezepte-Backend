var express = require('express');
var api = express.Router();

const User = require('../models/user');
const Recipe = require('../models/recipe');
const Picture = require('../models/picture');
const RecipeUser = require('../models/recipeUser');

const jwt = require('jsonwebtoken');
const cryptojs = require('crypto-js');
const path = require('path');
const fs = require('fs').promises;

const imageKit = require('../utils/imageKit');

const { authorization, invalidateToken } = require('../helper/authorization');

const { send, email } = require('../utils/emailTransporter');

const queryNewPassword = require('../templates/resetPassword');

const validate = require('../validators/index');
const {
    resetPassword,
    setPassword,
    newPassword,
    deleteUser,
} = require('../validators/user');

api.get('/', authorization, async (req, res) => {
    try {
        // checking if username exists
        const user = await User.findById(req.user.id);

        res.status(200).send({
            username: user.username,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

api.post('/password', resetPassword, validate, async (req, res) => {
    try {
        // checking if user is in db
        const user = await User.findOne({
            username: req.body.username,
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
        const folder = path.join(__dirname, '..', '/public');
        if (deletedRecipes) {
            deletedRecipes.forEach(async (deletedRecipe) => {
                deletedRecipe.pictures.forEach(async (picId) => {
                    const deletedPicture = await Picture.findOneAndRemove({
                        _id: picId,
                        user: req.user.id,
                    });
                    if (deletedPicture) {
                        if (process.env.IMAGEKIT_PUBLIC_KEY) {
                            await imageKit.deleteFile(deletedPicture._id);
                        } else {
                            await fs.unlink(`${folder}/${deletedPicture.file}`);
                        }
                    }
                    await RecipeUser.deleteMany({
                        recipe: deletedRecipe._id,
                    });
                });
            });
        }
        const deletedImages = await Picture.find({ user: req.user.id });
        await Picture.deleteMany({ user: req.user.id });
        if (deletedImages) {
            deletedImages.forEach(async (deletedImage) => {
                if (process.env.IMAGEKIT_PUBLIC_KEY) {
                    try {
                        await imageKit.deleteFile(deletedImage._id);
                    } catch (err) {
                        // images are stored in two different folders: localhost and production
                    }
                } else {
                    try {
                        await fs.unlink(`${folder}/${deletedImage.file}`);
                    } catch (err) {
                        // images are stored in two different folders: localhost and production
                    }
                }
                await Recipe.findByIdAndUpdate(deletedImage.recipe, {
                    $pull: { pictures: deletedImage._id },
                });
            });
        }
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
        res.status(500).json({ message: err.message });
    }
});

module.exports = api;
