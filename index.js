/*
 * Primary file for the API
 */

// Dependencies
const server = require('./lib/server');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Declare the app
const app = {};

// Init function
app.init = function() {

  // Instantiate a new server
  var s = new server.Server();

  // Setup app handlers
  s.router.path('/users')
    .method('GET', handlers.listUsers)
    .method('POST', handlers.createUser);

  s.router.path('/users/{userEmail}')
    .method('GET', handlers.retrieveUser)
    .method('PATCH', handlers.updateUser)
    .method('DELETE', handlers.deleteUser);

  // Generate documentation
  if (process.env.APIDOC) {
    const doc = helpers.genApiDoc(s.router);
    console.log(doc);
    return;
  }

  // Start listening
  s.start();

};

// Execute
app.init();

// Export the app
module.exports = app;
