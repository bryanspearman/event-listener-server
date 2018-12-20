const express = require('express');
const passport = require('passport');
const eventRouter = express.Router();

const { logInfo, logError, logSuccess } = require('./logger.js');
const { Event } = require('./models.js');
const { HTTP_STATUS_CODES } = require('./config.js');
const { filterObject, checkObjectProperties } = require('./helpers.js');

const jwtPassportMiddleware = passport.authenticate('jwt', { session: false });

// ### Create ###
eventRouter.post('/', jwtPassportMiddleware, (request, response) => {
  // Checks for required fields inside request body. If any are missing, responds with an error.
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
    notes: request.body.notes
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

// ### Read ###
eventRouter.get('/', jwtPassportMiddleware, (request, response) => {
  logInfo('Fetching previous responses ...');
  Event.find({ user: request.user._id })
    .then(events => {
      logSuccess('Response collection fetched succesfully');
      response.json(events.map(event => event.serialize()));
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### Update ###
eventRouter.put('/:id', jwtPassportMiddleware, (request, response) => {
  // Checks for required fields inside request body. If any are missing, responds with an error.
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
      return response.status(HTTP_STATUS_CODES.NO_CONTENT).end();
    })
    .catch(err => {
      logError(err);
      return response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

// ### Delete ###
eventRouter.delete('/:id', jwtPassportMiddleware, (request, response) => {
  logInfo('Deleting response document ...');
  Event.findByIdAndRemove(request.params.id)
    .then(() => {
      logSuccess('Deleted response document succesfully');
      response.status(HTTP_STATUS_CODES.NO_CONTENT).end();
    })
    .catch(err => {
      logError(err);
      response
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: 'Internal server error' });
    });
});

module.exports = { eventRouter };
