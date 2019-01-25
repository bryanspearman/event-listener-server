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

describe('Testing auth api', function() {
  const _id = User._id;
  const username = 'exampleUser';
  const password = 'examplePass';
  const firstName = 'exampleFirstName';
  const lastName = 'exampleLastName';

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

  describe('/api/auth/login', function() {
    it('Should reject requests with no credentials', async function() {
      try {
        const response = await chai.request(app).post('/api/auth/login');
        expect(response, 'Request should not succeed');
        expect(response).to.have.status(400);
        expect(response.text).to.equal('Bad Request');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(400);
      }
    });

    it('Should reject requests with incorrect usernames', async function() {
      try {
        const response = await chai
          .request(app)
          .post('/api/auth/login')
          .send({ username: 'wrongUsername', password });
        return expect(response, 'Request should not succeed');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(401);
      }
    });

    it('Should reject requests with incorrect passwords', async function() {
      try {
        const response = await chai
          .request(app)
          .post('/api/auth/login')
          .send({ username, password: 'wrongPassword' });
        return expect(response, 'Request should not succeed');
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(401);
      }
    });

    it('Should return a valid auth token', async function() {
      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ username, password });
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      const token = res.body.authToken;
      expect(token).to.be.a('string');
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithm: ['HS256']
      });
      expect(payload.user).to.deep.equal({
        _id: payload.user._id,
        username,
        firstName,
        lastName
      });
    });
  });

  describe('/api/auth/refresh', function() {
    it('Should reject requests with no credentials', async function() {
      try {
        const response = await chai.request(app).post('/api/auth/refresh');
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
          .post('/api/auth/refresh')
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
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: Math.floor(Date.now() / 1000) - 30 // Expired thirty seconds ago
        }
      );

      try {
        const response = await chai
          .request(app)
          .post('/api/auth/refresh')
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

    it('Should return a valid auth token with a newer expiry date', async function() {
      const token = jwt.sign(
        {
          user: {
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
      const decoded = jwt.decode(token);

      const res = await chai
        .request(app)
        .post('/api/auth/refresh')
        .set('authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      const token_1 = res.body.authToken;
      expect(token_1).to.be.a('string');
      const payload = jwt.verify(token_1, JWT_SECRET, {
        algorithm: ['HS256']
      });
      expect(payload.user).to.deep.equal({
        username,
        firstName,
        lastName
      });
      expect(payload.exp).to.be.at.least(decoded.exp);
    });
  });
});
