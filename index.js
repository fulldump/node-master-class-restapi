/*
 * Primary file for the API
 */

 // Dependencies
 const server = require('./lib/server');

// Declare the app
const app = {};

// Init function
app.init = function() {

  var s = new server.Server();
  s.start();

};

// Execute
app.init();

// Export the app
module.exports = app;
