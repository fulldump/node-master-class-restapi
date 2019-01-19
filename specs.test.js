/**
 * This specs file check all project specs are satisfied
 */

// Dependencies
const app = require('./app');
const testing = require('./lib/testing');
const helpers = require('./lib/helpers');
const makeRequest = helpers.makeRequest;

// Initialize suite
var suite = new testing.Suite();

// SPEC 1
// New users can be created, their information can be edited, and they can be
// deleted. We should store their name, email address, and street address.
suite.addAsync(function Spec1(t) {

  // Base url
  const host = 'localhost:3000';

  // "We should store their name, email address, and street address."
  const name = 'Mengano';
  const email = `mengano${helpers.createRandomString(20)}@email.com`;
  const address = 'Elm street 7'

  // "users can be created"
  makeRequest('POST', `http://${host}/users`, {}, {
    name,
    email,
    address,
    password: '1234',
  }).then(function(res) {

    // Check user has been created
    t.deepEqual(res.statusCode, 201);
    t.deepEqual(res.payload.name, name);
    t.deepEqual(res.payload.email, email);
    t.deepEqual(res.payload.address, address);

    // "their information can be edited"
    const newInformation = {
      name: 'Fulano',
      address: 'Baker street 11',
    };
    makeRequest('PATCH', `http://${host}/users/${email}`, {}, newInformation)
    .then(function(res) {

      // Retrieve user to check changes
      makeRequest('GET', `http://${host}/users/${email}`)
      .then(function(res) {

        // Check new information has been stored
        t.deepEqual(res.payload.name, newInformation.name);
        t.deepEqual(res.payload.address, newInformation.address);

        // and they can be deleted.
        makeRequest('DELETE', `http://${host}/users/${email}`)
        .then(function(res) {

          // Check deletion was ok
          t.deepEqual(res.statusCode, 200);

          // Check user no longer exists
          makeRequest('GET', `http://${host}/users/${email}`)
          .then(function(res) {
            t.deepEqual(res.statusCode, 404);
            t.done();
          });
        });
      });
    });
  });
});

// Initialize and start server
app.init();
app.start();

// Run suite
suite.run().then(function() {
  // Stop server
  app.stop();
});
