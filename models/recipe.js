// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

// Create Schema
const recipeSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  portion: {
    type: mongoose.Mixed,
    required: true
  },
  time: {
    type: mongoose.Mixed,
    required: true
  },
  keywords: {
    type: Array,
    required: true
  },
  ingredients: {
    type: mongoose.Mixed,
    required: true
  },
  steps: {
    type: Array,
    required: true
  },
  pictures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Picture'
  }],
},
{
    timestamps: true,
    versionKey: 'updates'
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
