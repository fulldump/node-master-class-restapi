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
  })
  .then(function(res) {

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

// SPEC 2
// Users can log in and log out by creating or destroying a token.
suite.addAsync(function Spec2(t) {

  // Base url
  const host = 'localhost:3000';

  // Credentials
  const email = `mengano${helpers.createRandomString(20)}@email.com`;
  const password = helpers.createRandomString(16);

  // Create user to work with
  makeRequest('POST', `http://${host}/users`, {}, {
    email,
    password,
    name: 'Zutanez',
    address: 'Elm Street',
  })
  .then(function(res) {

    // Check user has been created ok
    t.deepEqual(res.statusCode, 201);

    // Try to access a restricted resource
    makeRequest('GET', `http://${host}/menu`)
    .then(function(res) {

      // Check access is forbidden
      t.deepEqual(res.statusCode, 403);

      // "Users can log in [...] by creating [...] a token."
      makeRequest('POST', `http://${host}/tokens`, {}, {
        email, password,
      }).
      then(function(res) {

        // Check token has been created properly
        t.deepEqual(res.statusCode, 201);

        // Get token id
        const token = res.payload.id;
        // Try to access a restricted resource (this time it should work)
        makeRequest('GET', `http://${host}/menu`, {token})
        .then(function(res) {

          // Check status code is not 403
          t.deepEqual(res.statusCode, 200);

          // "Users can [...] and log out by [...] destroying a token."
          makeRequest('DELETE', `http://${host}/tokens/${token}`)
          .then(function(res) {

            // Check request was ok
            t.deepEqual(res.statusCode, 200);

            // Try to access with a deleted token (should be forbidden)
            makeRequest('GET', `http://${host}/menu`, {token})
            .then(function(res) {

              // Check access is forbidden with a deleted token
              t.deepEqual(res.statusCode, 403);

              // Notify async test has finished
              t.done();
            });
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
