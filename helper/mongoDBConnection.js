// jshint esversion: 8
// jshint node: true
'use strict';

const mongoose = require('mongoose');
const chalk = require('chalk');

const connectMongoDB = async function (cb) {
    if (process.env.MONGODB_URI) {
        mongoose.set('strictQuery', true);
        await mongoose
            .connect(`${process.env.MONGODB_URI}`, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then((db) => {
                console.log(
                    chalk.green(
                        'Connected to MongoDB (databasename: "' +
                            db.connections[0].name +
                            '") on host "' +
                            db.connections[0].host +
                            '" and on port "' +
                            db.connections[0].port +
                            '""'
                    )
                );
                cb();
            })
            .catch((err) => {
                console.log(chalk.red('Connection-Error: MongoDB'));
                console.log(err);
            });
    } else {
        mongoose.set('strictQuery', true);
        await mongoose
            .connect('mongodb://127.0.0.1:27017/delucse', {
                authSource: 'admin',
                user: process.env.MONGODB_USER,
                pass: process.env.MONGODB_PASSWORD,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then((db) => {
                console.log(
                    chalk.green(
                        'Connected to MongoDB (databasename: "' +
                            db.connections[0].name +
                            '") on host "' +
                            db.connections[0].host +
                            '" and on port "' +
                            db.connections[0].port +
                            '""'
                    )
                );
                cb();
            })
            .catch((err) => {
                console.log(chalk.red('Connection-Error: MongoDB'));
                console.log(err);
            });
    }
};

module.exports = {
    connectMongoDB,
};
