var express = require('express');
var recipe = express.Router();

const { upload } = require("../helper/uploadImages");
const { authorization } = require("../helper/authorization");

const mongoose = require('mongoose');
const Picture = require('../models/picture');
const Recipe = require('../models/recipe');


recipe.post('/', authorization, (req, res) => {
  upload.array('pictures')(req, res, (async err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
          // 'File too large'
          return res.send('Mind. eine Bilder-Datei ist zu groß.');
      } else {
          return res.send(err);
      }
    } else {
      try {
        var {title, source, portion, time, keywords, ingredients, steps} = req.body;
        var newRecipe = {title, source, portion, time, keywords, ingredients, steps, user: req.user.id};
        if(req.files){
          const promises = req.files.map(file => {
            var newPic = new Picture({
              contentType: file.mimetype,
              size: file.size,
              file: file.filename
            });
            return newPic.save().then(pic => pic._id); // return the promise without calling it yet
          });
          const pictures = await Promise.all(promises);
          newRecipe.pictures = pictures;
        }
        const recipe = await new Recipe(newRecipe).save().then(recipe => recipe._id);
        res.send({ msg: 'created recipe successfully', id: recipe});
      } catch (e) {
        res.status(400).json({ msg: e.message });
      }
    }
  }));
});

recipe.get('/', async (req, res) => {
  try {
    const recipe = await Recipe.find({}).populate('pictures', 'file');
    res.send(recipe);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

recipe.get('/user', authorization, async (req, res) => {
  try {
    const recipe = await Recipe.find({user: req.user.id}).populate('pictures', 'file');
    res.send(recipe);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

recipe.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('pictures', 'file');
    if(recipe){
      res.send(recipe);
    } else {
      res.status(400).send({ msg: 'Recipe not available.' });
    }
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});


module.exports = recipe;
