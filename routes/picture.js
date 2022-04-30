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
            return res.staus(400).json({msg: 'Mind. eine Bilder-Datei ist zu groß.'});
        } else {
            return res.status(400).json({msg: err.message});
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
        } catch (e) {
          res.status(400).json({ msg: e.message });
        }        
      }
      else {
        res.staus(400).json({msg: 'Keine Bilder übergeben'});
      }  
    }
  }));
});

api.get('/', async function(req, res, next) {
  try{
    var result = await Picture.find();
    res.status(200).send(result);
  }
  catch(e){
    res.status(500).json({msg: e.message });
  }
});

module.exports = api;
