/* global describe, it, before, after, beforeEach, afterEach */
'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { User } = require('../users/models.js');
const { TEST_DATABASE_URL } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Testing user api', function() {
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

  beforeEach(function() {});

  afterEach(function() {
    return User.deleteOne({});
  });

  describe('/api/users', function() {
    describe('POST', function() {
      it('Should reject users with missing username', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              password,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('username');
        }
      });

      it('Should reject users with missing password', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('password');
        }
      });

      it('Should reject users with non-string username', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username: 1234,
              password,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('username');
        }
      });

      it('Should reject users with non-string password', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password: 1234,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('password');
        }
      });

      it('Should reject users with non-string first name', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password,
              firstName: 1234,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('firstName');
        }
      });

      it('Should reject users with non-string last name', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password,
              firstName,
              lastName: 1234
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('lastName');
        }
      });

      it('Should reject users with non-trimmed username', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username: ` ${username} `,
              password,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('username');
        }
      });

      it('Should reject users with non-trimmed password', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password: ` ${password} `,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('password');
        }
      });

      it('Should reject users with empty username', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username: '',
              password,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 1 characters long'
          );
          expect(res.body.location).to.equal('username');
        }
      });

      it('Should reject users with password less than ten characters', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password: '123456789',
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 10 characters long'
          );
          expect(res.body.location).to.equal('password');
        }
      });

      it('Should reject users with password greater than 72 characters', async function() {
        try {
          const response = await chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password: new Array(73).fill('a').join(''),
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at most 72 characters long'
          );
          expect(res.body.location).to.equal('password');
        }
      });

      it('Should reject users with duplicate username', async function() {
        // Create an initial user
        try {
          await User.create({
            username,
            password,
            firstName,
            lastName
          });
          const response = await // Try to create a second user with the same username
          chai
            .request(app)
            .post('/api/users')
            .send({
              username,
              password,
              firstName,
              lastName
            });
          return expect(response, 'Request should not succeed');
        } catch (err) {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Username already taken');
          expect(res.body.location).to.equal('username');
        }
      });

      it('Should create a new user', async function() {
        const res = await chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password,
            firstName,
            lastName
          });
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.keys(
          '_id',
          'username',
          'firstName',
          'lastName'
        );
        expect(res.body.username).to.equal(username);
        expect(res.body.firstName).to.equal(firstName);
        expect(res.body.lastName).to.equal(lastName);
        const user = await User.findOne({
          username
        });
        expect(user).to.not.be.null;
        expect(user.firstName).to.equal(firstName);
        expect(user.lastName).to.equal(lastName);
        const passwordIsCorrect = user.validatePassword(password);
        expect(passwordIsCorrect).to.be.true;
      });

      it('Should trim firstName and lastName', async function() {
        const res = await chai
          .request(app)
          .post('/api/users')
          .send({
            _id,
            username,
            password,
            firstName: ` ${firstName} `,
            lastName: ` ${lastName} `
          });
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.keys(
          '_id',
          'username',
          'firstName',
          'lastName'
        );
        expect(res.body.username).to.equal(username);
        expect(res.body.firstName).to.equal(firstName);
        expect(res.body.lastName).to.equal(lastName);
        const user = await User.findOne({
          username
        });
        expect(user).to.not.be.null;
        expect(user.firstName).to.equal(firstName);
        expect(user.lastName).to.equal(lastName);
      });
    });
  });
});
