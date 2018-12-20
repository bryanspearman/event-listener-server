'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const { logInfo, logError, logSuccess } = require('./auth');
const { PORT, DATABASE_URL, HTTP_STATUS_CODES } = require('./config');
const { router: usersRouter } = require('./users');
const { router: eventRouter } = require('./events');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

const app = express();
mongoose.Promise = global.Promise;
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use(morgan('[:date[web]] :method :url :status'));
app.use(express.json());
app.use(express.static('./public'));
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/event/', eventRouter);

// CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(HTTP_STATUS_CODES.NO_CONTENT);
  }
  next();
});

const jwtAuth = passport.authenticate('jwt', { session: false });

//protected endpoint needs valid JWT to access
app.get('/api/protected', jwtAuth, (req, res) => {
  res.status(HTTP_STATUS_CODES.OK).json({ data: 'Data string' });
});

// responds to unhandled routes
app.use('*', (req, res) => {
  res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ message: 'Not Found' });
});

let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    logInfo('Starting mongodb connection ...');
    mongoose.connect(
      databaseUrl,
      { useNewUrlParser: true },
      err => {
        if (err) {
          return reject(err);
        } else {
          logSuccess('Mongodb connection succesful.');
          logInfo('Starting express server ...');

          server = app
            .listen(port, () => {
              logSuccess(
                `Express server listening on http://localhost:${PORT}`
              );
              resolve();
            })
            .on('error', err => {
              logError(err);
              mongoose.disconnect();
              reject(err);
            });
        }
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    new Promise((resolve, reject) => {
      logInfo('Stopping express server ...');
      server.close(err => {
        if (err) {
          logError(err);
          return reject(err);
        } else {
          logInfo('Express server stopped.');
          resolve();
        }
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
