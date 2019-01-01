const express = require('express');
const passport = require('passport');
const router = express.Router();
const { filterObject, checkObjectProperties } = require('../auth/helpers');
const { logInfo, logError, logSuccess } = require('../auth/logger');
const { Item } = require('./models');
const { HTTP_STATUS_CODES } = require('../config');

const jwtAuth = passport.authenticate('jwt', { session: false });

// ### Create ###
router.post('/', jwtAuth, (request, response) => {
  // Checks for required fields
  const fieldsNotFound = checkObjectProperties(
    ['itemTitle', 'itemDate'],
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
  Item.create({
    user: request.user._id,
    itemTitle: request.body.itemTitle,
    itemDate: request.body.itemDate,
    itemNotes: request.body.itemNotes
  })
    .then(item => {
      logSuccess('New response document created');
      return response.status(HTTP_STATUS_CODES.CREATED).json(item.serialize());
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
  logInfo('Fetching items ...');
  Item.find({ user: request.user._id })
    .then(items => {
      logSuccess('List of items fetched succesfully');
      response.json(items.map(item => item.serialize()));
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
  logInfo('Fetching a specific item');
  Item.findById(request.params.id)
    .then(item => {
      logSuccess(
        `Item requested with id: "${request.params.id}" fetched succesfully`
      );
      response.json(item.serialize());
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
    ['itemTitle', 'itemDate'],
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
    ['itemTitle', 'itemDate', 'itemNotes'],
    request.body
  );

  Item.findByIdAndUpdate(
    request.params.id,
    { $set: fieldsToUpdate },
    { new: true }
  )
    .then(() => {
      logSuccess(
        `Item with the id: ${request.params.id} was updated succesfully`
      );
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
  Item.findByIdAndRemove(request.params.id)
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
