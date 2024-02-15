var createError = require('http-errors');
var express = require('express');
var path = require('path');
var request = require('request');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require('cors');

var api = express();

//reads in configuration from a .env file
require('dotenv').config({
    path: `.env.${process.env.NODE_ENV || 'development'}`,
});

api.use(logger('dev'));
api.use(cors({ credentials: true, origin: process.env.APP_BASE_URL }));

api.set('views', './views');
api.set('view engine', 'hbs');

api.use(bodyParser.json({ limit: '10mb', extended: true }));
api.use(cookieParser());

if (process.env.MEDIA) {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || process.env.MEDIA_PATH) {
        api.use(
            `/${process.env.NODE_ENV === 'production' ? '' : 'media'}`,
            express.static(
                path.join(__dirname, process.env.MEDIA_PATH || 'public')
            )
        );
    } else {
        var mediaRouter = express.Router();
        mediaRouter.get('/:media', (req, res) => {
            request(
                `https://ik.imagekit.io/${process.env.IMAGEKIT_ID}/` +
                    req.params.media
            ).pipe(res);
        });
        api.use(
            `/${process.env.NODE_ENV === 'production' ? '' : 'media'}`,
            mediaRouter
        );
    }
} else if (process.env.SHARE) {
    var shareRouter = express.Router();
    shareRouter.get('/', (req, res) => {
        res.redirect(process.env.APP_BASE_URL);
    });
    var sRouter = require('./routes/share');
    shareRouter.use('/r', sRouter);
    api.use(
        `/${process.env.NODE_ENV === 'production' ? '' : 'share'}`,
        shareRouter
    );
} else {
    var apiRouter = express.Router();

    var indexRouter = require('./routes/index');
    apiRouter.use('/', indexRouter);

    var statisticRouter = require('./routes/statistics');
    apiRouter.use('/stats', statisticRouter);

    var authRouter = require('./routes/auth');
    apiRouter.use('/auth', authRouter);

    var userRouter = require('./routes/user');
    apiRouter.use('/user', userRouter);

    var imageRouter = require('./routes/image');
    apiRouter.use('/recipe/image', imageRouter);

    var recipeRouter = require('./routes/recipe');
    apiRouter.use('/recipe', recipeRouter);

    var favoriteRouter = require('./routes/favorite');
    apiRouter.use('/recipe/favorite', favoriteRouter);

    var noteRouter = require('./routes/note');
    apiRouter.use('/recipe/note', noteRouter);

    var mailRouter = require('./routes/mail');
    apiRouter.use('/mail', mailRouter);

    api.use(
        `/${
            process.env.MONGODB_URI || process.env.NODE_ENV === 'production'
                ? ''
                : 'api'
        }`,
        apiRouter
    );
}

// catch 404 and forward to error handler
api.use(function (req, res, next) {
    next(createError(404));
});

// error handler
api.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    // res.locals.error = req.api.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    if (process.env.MEDIA) {
        res.send('Not Found');
    } else {
        res.json({ message: `Error: ${err.message}` });
    }
});

module.exports = api;
