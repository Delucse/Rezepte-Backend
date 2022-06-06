// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

// Create Schema
const recipeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  portion: {
    count: {
      type: Number,
      required: true
    },
    volume: {
      type: Number,
      required: true
    }
  },
  time: {
    preparation: {
      type: Number,
      required: true
    },
    resting: {
      type: Number,
      required: true
    },
    baking: {
      type: Number,
      required: true
    }
  },
  keywords: {
    type: Array,
    required: true
  },
  ingredients: [
    {
      title: {
        type: String,
        required: true
      },
      food: [
        {
          amount: {
            type: Number,
            required: true
          },
          unit: {
            type: String,
            required: true
          },
          aliment: {
            type: String,
            required: true
          }
        }
      ]
    }
  ],
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
