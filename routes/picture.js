var express = require('express');
var api = express.Router();

const { upload } = require("../helper/uploadImages");

const mongoose = require('mongoose');
const Picture = require('../models/picture');


api.post('/', (req, res) => {
  // upload.array('name of form in HTML')
  upload.array('pictures')(req, res, (async err => {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            // 'File too large'
            return res.send('Mind. eine Bilder-Datei ist zu groß.');
        } else {
            return res.send(err);
        }
    } else {
      if(req.files.length > 0){
        try {
          const promises = req.files.map(file => {
            var newPic = new Picture({
              description: req.body.description,
              contentType: file.mimetype,
              size: file.size,
              file: file.filename
            });
            return newPic.save(); //.then(image => image._id); // return the promise without calling it yet
          });
          const images = await Promise.all(promises);
          res.status(200).send('Pictures are uploaded successfully.')
        } catch (err) {
          res.status(400).json(err);
        }        
      }
      else {
        return res.send('Keine Bilder übergeben');
      }  
    }
  }));
});

api.get('/', async function(req, res, next) {
  try{
    var result = await Picture.find();
    return res.status(200).send(
      result
    );
  }
  catch(err){
    return res.status(500).send(err);
  }
});

module.exports = api;
