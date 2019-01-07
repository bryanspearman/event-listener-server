'use strict';
// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const { CLIENT_ORIGIN } = require('./config');
const cors = require('cors');
const { logInfo, logError, logSuccess } = require('./auth/logger.js');
const { PORT, DATABASE_URL, HTTP_STATUS_CODES } = require('./config');
const { router: usersRouter } = require('./users');
const { router: itemRouter } = require('./items');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

const app = express();
mongoose.Promise = global.Promise;
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use(morgan('[:date[web]] :method :url :status'));
app.use(express.json());
app.use(express.static('./public'));

// CORS
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});
å;
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/items/', itemRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

//protected endpoint needs valid JWT to access
app.get('/api/items', jwtAuth, (req, res) => {
  res.status(HTTP_STATUS_CODES.OK).json({ item: {} });
});

// responds to unhandled routes
app.use('*', (req, res) => {
  res
    .status(HTTP_STATUS_CODES.NOT_FOUND)
    .json({ message: 'This route is not available' });
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
              logSuccess(`Express server listening on PORT: ${PORT}`);
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
