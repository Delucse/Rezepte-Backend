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

const createSearchAggregate = ({search, type, keywords, sort, ascending}, match) => {
  const aggregate = [];

  if(search){
    var score = 1;
    if(type && type !== 'all'){
      if(type === 'ingredients'){
        aggregate.push({$unwind: '$ingredients'});
        aggregate.push({$set: {ingredients: {$reduce: {input: "$ingredients.food.aliment", initialValue: "", in: {$concat : ["$$value", "$$this"]}}}}});      
      }
      else if(type === 'keywords'){
        type = 'keys'
        aggregate.push({$set: {keys: {$reduce: {input: "$keywords", initialValue: "", in: {$concat : ["$$value", "$$this"]}}}}});
      }
      else if(type === 'steps'){
        aggregate.push({$unwind: '$steps'});
      }
      search = search.replaceAll(/(\s*(,|;)\s*|\s+)/gi,' ').replace(/\s$/, '').split(' ');
      var scoreRegEx = search.map(search => {
        return {$size: {$regexFindAll: {input: `$${type}`, regex: search, options: 'i'}}}
      })
      if(match){
        aggregate.push({$match: match});
      }
      aggregate.push({ $set: {score: {$sum: scoreRegEx}}});
      aggregate.push({ $match: {score: {$gt: 0}}});
    } else {
      if(match){
        aggregate.push({ $match: {$and:  [match, {$text: { $search: search } }]}});
      } else {
        aggregate.push({ $match: {$text: { $search: search }}});
      }
      score = { $meta: "textScore" }; // default value for search term
    }
  } else {
    if(match){
      aggregate.push({$match: match});
    }
    sort = 'title'; // default sort for no search term
  }

  if(keywords){
    keywords = keywords.replaceAll(/(\s*(,|;)\s*|\s+)/gi,',').replace(/,$/, '').split(',');
    var keywordsRegEx = keywords.map(key => {
      return {keywords: {$regex: key, $options: 'i'}};
    });
    aggregate.push({ $match: {$and: keywordsRegEx}});  
  }

  aggregate.push({ $set: { time: { $add: [ "$time.preparation", "$time.resting", "$time.baking" ] } } });
  aggregate.push({ $lookup: {from: 'pictures', localField: 'pictures', foreignField: '_id', as: 'pictures'}}); // populate('pictures', 'file');

  if(sort){
    if(sort === 'title'){
      sort = 'lowerTitle';
      aggregate.push({ $set: { lowerTitle: { $toLower: "$title" }}}); // collation does also the trick
    }
  } else {
    sort = 'score' // default value
  }

  if(ascending && ascending === 'false'){
    ascending = -1;
  } else {
    ascending = 1;
  }

  aggregate.push({ $sort : { [sort]: ascending, _id: ascending } });
  aggregate.push({ $project: {title: 1, picture: {$arrayElemAt: ["$pictures.file", 0]}, time: 1, keywords: 1, date: '$createdAt', score: score}});
  
  return aggregate;
};

recipe.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.aggregate(createSearchAggregate(req.query));
    res.send(recipes);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

recipe.get('/user', authorization, async (req, res) => {
  try {
    const match = {user: req.user.id};
    const recipes = await Recipe.aggregate(createSearchAggregate(req.query, match));
    res.send(recipes);
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
