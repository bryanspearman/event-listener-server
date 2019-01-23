/* global describe, it, before, after, beforeEach, afterEach */
'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { User } = require('../users/models.js');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Testing protected endpoint', function() {
  const _id = User._id;
  const username = 'exampleUser';
  const password = 'examplePass';
  const firstName = 'Example';
  const lastName = 'User';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        _id,
        username,
        password,
        firstName,
        lastName
      })
    );
  });

  afterEach(function() {
    return User.deleteOne({});
  });

  describe('/api/items', function() {
    it('Should reject requests with no credentials', async function() {
      try {
        const response = await chai.request(app).get('/api/items');
        return expect(response, 'Request should not succeed');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(401);
      }
    });

    it('Should reject requests with an invalid token', async function() {
      const token = jwt.sign(
        {
          _id,
          username,
          firstName,
          lastName
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );

      try {
        const response = await chai
          .request(app)
          .get('/api/items')
          .set('Authorization', `Bearer ${token}`);
        return expect(response, 'Request should not succeed');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(401);
      }
    });

    it('Should reject requests with an expired token', async function() {
      const token = jwt.sign(
        {
          user: {
            _id,
            username,
            firstName,
            lastName
          },
          exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username
        }
      );

      try {
        const response = await chai
          .request(app)
          .get('/api/items')
          .set('authorization', `Bearer ${token}`);
        return expect(response, 'Request should not succeed');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(401);
      }
    });

    it('Should send dashboard data', async function() {
      const token = jwt.sign(
        {
          user: {
            _id,
            username,
            firstName,
            lastName
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );

      const res = await chai
        .request(app)
        .get('/api/items')
        .set('authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });
  });
});
