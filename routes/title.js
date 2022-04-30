var express = require('express');
var api = express.Router();

const mongoose = require('mongoose');
const Title = require('../models/title');

api.get('/', async function(req, res, next) {
  try{
    var result = await Title.find();
    res.status(200).send(result);
  }
  catch(err){
    res.status(500).json({msg: err.message});
  }
});

api.put('/', async function(req, res, next) {
  try{
    var result = await Title.find();
    if(result[0]){
      result = await Title.findOneAndUpdate({_id: result[0]._id}, {title: req.body.title}, {upsert: true, new: true});
    } else {
      // set initial title
      result = await new Title({title: req.body.title}).save();
    }
    res.status(200).send(
      result
    );
  }
  catch(err){
    res.status(500).json({msg: err.message});
  }
});

module.exports = api;
