const mongoose = require('mongoose');
const faker = require('faker');
const { User } = require('../users/models.js');
const { Item } = require('../items/models.js');
const { logInfo, logWarn, logSuccess, logError } = require('../auth/logger.js');

module.exports = {
  createMockDatabase,
  deleteMockDatabase,
  getNewFakeItem
};

//Populates the database with 10 records
function createMockDatabase() {
  logInfo('Seeding mock database...');
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push({
      _id: User._id,
      itemTitle: faker.name.title(),
      itemDate: faker.date.future(),
      itemNotes: faker.lorem.text()
    });
  }
  return Item.insertMany(seedData)
    .then(() => {
      logSuccess('Mock database created.');
    })
    .catch(err => {
      logError(err);
    });
}

function deleteMockDatabase() {
  return new Promise((resolve, reject) => {
    logWarn('Deleting mock database ...');
    mongoose.connection
      .dropDatabase()
      .then(result => {
        logSuccess('Mock database deleted.');
        resolve(result);
      })
      .catch(err => {
        logError(err);
        reject(err);
      });
  });
}

function getNewFakeItem() {
  return {
    user: User._id,
    itemTitle: faker.name.title(),
    itemDate: faker.date.future(),
    itemNotes: faker.lorem.text()
  };
}
