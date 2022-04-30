var express = require('express');
var api = express.Router();

api.get('/', function(req, res, next) {
  res.json('Willkommen auf der API "Delucse Rezepte"');
});

module.exports = api;
