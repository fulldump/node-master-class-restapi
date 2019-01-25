/**
 * Tests for router
*/

// Dependencies
const app = require('./app');
const testing = require('./lib/testing');
const helpers = require('./lib/helpers');
const makeRequest = helpers.makeRequest;
const datalib = require('./lib/data');

// Initialize suite
var suite = new testing.Suite();


// Write all tests cases

suite.addAsync(function CrudUsers(t) {

  const userEmail = helpers.createRandomString(10) + '@email.com';
  const userPassword = '123456';

  // 1: Create user
  makeRequest('POST', 'http://localhost:3000/users', {}, {
    name: 'Fulanez',
    email: userEmail,
    password: userPassword,
    address: 'Elm street 88',
  })
  .then(function(res) {
    var user = res.payload;
    var expectedUser = {
      name: 'Fulanez',
      email: userEmail,
      address: 'Elm street 88',
      createTimestamp: user.createTimestamp,
    };
    t.deepEqual(user, expectedUser);
    t.deepEqual(res.statusCode, 201);

    // 2: Retrieve user
    makeRequest('GET', 'http://localhost:3000/users/'+userEmail)
    .then(function(res) {
      var user = res.payload;
      t.deepEqual(user, expectedUser);
      t.deepEqual(res.statusCode, 200);

      // 3: Update user
      makeRequest('PATCH', 'http://localhost:3000/users/'+userEmail, {}, {
        name: 'Mengano',
      })
      .then(function(res) {
        var user = res.payload;
        expectedUser.name = 'Mengano';
        expectedUser.updateTimestamp = user.updateTimestamp;
        t.deepEqual(user, expectedUser);
        t.deepEqual(res.statusCode, 200);

        // 4: Delete user
        makeRequest('DELETE', 'http://localhost:3000/users/'+userEmail)
        .then(function(res) {
          var user = res.payload;
          t.deepEqual(user, expectedUser);
          t.deepEqual(res.statusCode, 200);

          // 5: Retrieve user again (should be not found)
          makeRequest('GET', 'http://localhost:3000/users/'+userEmail)
          .then(function(res) {
            t.deepEqual(res.statusCode, 404);
            t.done();
          })
        });
      });
    });
  });
});

suite.addAsync(function TokensCrud(t) {

  const name = helpers.createRandomString(10);
  const email = name + '@email.com';
  const password = '123456';
  const address = 'Elm Street 7';

  // 1: Create user
  makeRequest('POST', 'http://localhost:3000/users', {}, {email, password, name, address}).then(function(res) {

    t.deepEqual(res.statusCode, 201);

    // 2: Login (create token)
    makeRequest('POST', 'http://localhost:3000/tokens', {}, {email, password}).then(function(res) {
      const token = res.payload;
      t.deepEqual(token, {
        email,
        id: token.id,
        expires: token.expires,
      });
      t.deepEqual(res.statusCode, 201);

      // 3: Retrieve token
      makeRequest('GET', `http://localhost:3000/tokens/${token.id}`).then(function(res) {
        t.deepEqual(res.payload, token);
        t.deepEqual(res.statusCode, 200);

        // 4: Delete token
        makeRequest('DELETE', `http://localhost:3000/tokens/${token.id}`).then(function(res) {
          t.deepEqual(res.payload, token);
          t.deepEqual(res.statusCode, 200);
          t.done();
        });
      });
    });
  });
});

suite.addAsync(function ListUsersByAdminsOnly(t) {

  // List users can only be done by admin users, in other words:
  // - A valid token should be provided
  // - User for that token should be admin

  makeRequest('GET', `http://localhost:3000/users`).then(function(res) {
    // CHECK: no user logged in should fail:
    t.deepEqual(res.statusCode, 403);
    t.deepEqual(res.payload, {error: "Header 'Token' is mandatory"});

    // Create regular user
    const name = helpers.createRandomString(10);
    const email = name + '@email.com';
    const password = '123456';
    const address = 'Elm Street 7';
    makeRequest('POST', `http://localhost:3000/users`, {}, {name, email, password, address}).then(function(res) {
      t.deepEqual(res.statusCode, 201);
      var user = res.payload;

      // Create a token for that user
      makeRequest('POST', `http://localhost:3000/tokens`, {}, {email, password}).then(function(res) {
        t.deepEqual(res.statusCode, 201);
        const token = res.payload.id;

        // CHECK: non admin users can not list users
        makeRequest('GET', `http://localhost:3000/users`, {token}).then(function(res) {
          t.deepEqual(res.statusCode, 403);
          t.deepEqual(res.payload, {error: 'Only admin users can list users'});

          // Modify user to make it admin (ugly way: accessing persistence layer)
          user.scopes = user.scopes || {};
          user.scopes.admin = true;
          datalib.update('users', email, user, function(err) {
            // Assume err is nil for this test

            // CHECK: admin user can list users
            makeRequest('GET', `http://localhost:3000/users`, {token}).then(function(res) {
              t.deepEqual(res.statusCode, 200);
              t.done();
            });
          });
        });
      });
    });
  });
});

// TEST: Shopping cart. The user can retrieve a shopping cart and add elements
// to it
suite.addAsync(function ShoppingCart(t) {

  const name = helpers.createRandomString(20);
  const email = name + '@email.com';
  const password = '123456';
  const address = 'Elm Street 777';

  // 1: Create User
  makeRequest('POST', 'http://localhost:3000/users', {}, {email, password, name, address}).then(function(res) {

    t.deepEqual(res.statusCode, 201);

    // 2: Login (create token)
    makeRequest('POST', 'http://localhost:3000/tokens', {}, {email, password}).then(function(res) {

      t.deepEqual(res.statusCode, 201);

      const token = res.payload.id;

      // 3: Get cart (empty at the beginning)
      makeRequest('GET', 'http://localhost:3000/cart', {token}).then(function(res) {

        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.payload, {items:[]});

        // 4: Add item to cart
        makeRequest('POST', 'http://localhost:3000/cart', {token}, {
          id: '2fe59a3c-20c7-11e9-9d20-47dc3ae5af2e',
          quantity: 3,
        }).then(function(res) {

          t.deepEqual(res.statusCode, 200);
          t.deepEqual(res.payload.items[0].quantity, 3);

          // 5: Remove 2 items
          makeRequest('POST', 'http://localhost:3000/cart', {token}, {
            id: '2fe59a3c-20c7-11e9-9d20-47dc3ae5af2e',
            quantity: -2,
          }).then(function(res) {

            t.deepEqual(res.statusCode, 200);
            t.deepEqual(res.payload.items[0].quantity, 1);

            // 6: Try to add unexisting id
            makeRequest('POST', 'http://localhost:3000/cart', {token}, {
              id: 'unexisting-id',
              quantity: 3,
            }).then(function(res) {

              t.deepEqual(res.statusCode, 409);
              t.deepEqual(res.payload, {
                error: "Item 'unexisting-id' is not available",
              });

              // 7: Retrieve cart
              makeRequest('GET', 'http://localhost:3000/cart', {token}).then(function(res) {

                t.deepEqual(res.statusCode, 200);
                t.deepEqual(res.payload.items[0].quantity, 1);

                // Notify async test has finished
                t.done();
              });
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
