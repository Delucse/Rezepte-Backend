// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
},{
  timestamps: true
});


module.exports = mongoose.model('User', UserSchema);