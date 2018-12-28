const express = require('express');
const passport = require('passport');
const router = express.Router();
const { filterObject, checkObjectProperties } = require('../auth/helpers');
const { logInfo, logError, logSuccess } = require('../auth/logger');
const { Event } = require('./models');
const { HTTP_STATUS_CODES } = require('../config');

const jwtAuth = passport.authenticate('jwt', { session: false });

// ### Create ###
router.post('/', jwtAuth, (request, response) => {
  // Checks for required fields
  const fieldsNotFound = checkObjectProperties(
    ['eventTitle', 'targetDate'],
    request.body
  );
  if (fieldsNotFound.length > 0) {
    const errorMessage = `Bad Request: Missing the following fields from the request body: ${fieldsNotFound.join(
      ', '
    )}`;
    logError(errorMessage);
    return response
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .json({ error: errorMessage });
  }

  logInfo('Creating your response document ...');
  Event.create({
    user: request.user._id,
    eventTitle: request.body.eventTitle,
    targetDate: request.body.targetDate,
    eventNotes: request.body.eventNotes
  })
    .then(event => {
      logSuccess('New response document created');
      return response.status(HTTP_STATUS_CODES.CREATED).json(event.serialize());
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### Get ###
router.get('/', jwtAuth, (request, response) => {
  logInfo('Fetching events ...');
  Event.find({ user: request.user._id })
    .then(events => {
      logSuccess('Events collection fetched succesfully');
      response.json(events.map(event => event.serialize()));
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### GetbyId ###
router.get('/:id', jwtAuth, (request, response) => {
  logInfo('Fetching a specific event');
  Event.findById(request.params.id)
    .then(event => {
      logSuccess(`Event with the id: ${request.params.id} fetched succesfully`);
      response.json(event.serialize());
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### Update ###
router.put('/:id', jwtAuth, (request, response) => {
  // Checks for required fields
  const fieldsNotFound = checkObjectProperties(
    ['eventTitle', 'targetDate'],
    request.body
  );
  if (fieldsNotFound.length > 1) {
    const errorMessage = `Bad Request: Missing the following fields from the request body: ${fieldsNotFound.join(
      ', '
    )}`;
    logError(errorMessage);
    return response
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .json({ error: errorMessage });
  }

  logInfo('Updating response document ...');
  const fieldsToUpdate = filterObject(
    ['eventTitle', 'targetDate', 'notes'],
    request.body
  );

  Event.findByIdAndUpdate(
    request.params.id,
    { $set: fieldsToUpdate },
    { new: true }
  )
    .then(() => {
      logSuccess('Response document updated succesfully');
      return response.status(HTTP_STATUS_CODES.ACCEPTED).end();
    })
    .catch(err => {
      logError(err);
      return response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### Delete ###
router.delete('/:id', jwtAuth, (request, response) => {
  logInfo('Deleting response document ...');
  Event.findByIdAndRemove(request.params.id)
    .then(() => {
      logSuccess('Deleted response document succesfully');
      response.status(HTTP_STATUS_CODES.ACCEPTED).end();
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

module.exports = { router };
