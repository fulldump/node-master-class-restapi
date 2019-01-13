// Dependencies
const server = require('./lib/server');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
const authorized = handlers.authorized; // Shortcut
// Declare the app
const app = {};

// Init function
app.init = function() {

  // Instantiate a new server
  app.server = new server.Server();

  // Setup app handlers
  var router = app.server.router;

  router.path('/users')
    .method('GET', authorized(handlers.listUsers))
    .method('POST', handlers.createUser);

  router.path('/users/{userEmail}')
    .method('GET', handlers.retrieveUser)
    .method('PATCH', handlers.updateUser)
    .method('DELETE', handlers.deleteUser);

  router.path('/tokens')
    .method('POST', handlers.createToken);

  router.path('/tokens/{tokenId}')
    .method('GET', handlers.retrieveToken)
    .method('DELETE', handlers.deleteToken);

  router.path('/menu')
    .method('GET', authorized(handlers.listMenu));

  // Generate documentation
  if (process.env.APIDOC) {
    const doc = helpers.genApiDoc(router);
    console.log(doc);
    process.exit(0);
  }
};

app.start = function() {
  // Start listening
  app.server.start();
};

app.stop = function() {
  // Stop listening
  app.server.stop();
};

// Export the app
module.exports = app;
