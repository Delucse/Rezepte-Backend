var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

var api = express();

//reads in configuration from a .env file
require('dotenv').config();

api.use(logger('dev'));
api.use(cors());

api.use(bodyParser.json({limit: '10mb', extended: true}));

api.use('/media', express.static(path.join(__dirname, 'public')));

var router = express.Router();

var indexRouter = require('./routes/index');
router.use('/', indexRouter);

var authRouter = require('./routes/auth');
router.use('/auth', authRouter);

var userRouter = require('./routes/user');
router.use('/user', userRouter);

var titleRouter = require('./routes/title');
router.use('/title', titleRouter);

var pictureRouter = require('./routes/picture');
router.use('/pictures', pictureRouter);

var recipeRouter = require('./routes/recipe');
router.use('/recipe', recipeRouter);

api.use('/', router);

// catch 404 and forward to error handler
api.use(function(req, res, next) {
  next(createError(404));
});

// error handler
api.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  // res.locals.error = req.api.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({message: 'An Error has been thrown.' });
});

module.exports = api;
