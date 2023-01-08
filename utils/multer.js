// jshint esversion: 8
// jshint node: true
'use strict';

const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: process.env.IMAGEKIT_PUBLIC_KEY
        ? null
        : (req, file, cb) => {
              cb(null, path.join(__dirname, '..', '/public'));
          },
    filename: (req, file, cb) => {
        var extension = file.originalname.split('.');
        extension = extension[extension.length - 1];
        cb(null, uuidv4() + '.' + extension);
    },
});

var upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == 'image/png' ||
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/jpeg'
        ) {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    },
});

module.exports = upload;
