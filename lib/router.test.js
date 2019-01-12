/**
 * Tests for router
*/

// Dependencies
const Router = require('./router');
const testing = require('./testing');

// Initialize suite
var suite = new testing.Suite();

// Write all tests cases

suite.add(function MatchStaticPath(t) {
  var r = new Router();

  var handler = function(request, callback) {};

  r.path('/users')
    .method('GET', handler);

  // Happy path
  t.deepEqual(r.match('GET', '/users'), handler);

  // Undefined method
  t.deepEqual(r.match('POST', '/users'), null);

  // Undefined path
  t.deepEqual(r.match('GET', '/invented'), null);
});

suite.add(function MatchWilcardMethod(t) {
  var r = new Router();

  var handler = function(request, callback) {};

  r.path('/users')
    .method('POST', function() {})
    .method('*', handler);

  // Happy path
  t.deepEqual(r.match('DELETE', '/users'), handler);

});

suite.add(function DocumentMethod(t) {
  var r = new Router();

  var handler = function() {};
  var doc = `
    This endpoint will create a user
  `;

  r.path('/users')
    .method('POST', handler, doc);

  // Happy path
  t.deepEqual(r.match('POST', '/users').documentation, doc);

});

// Run suite
suite.run();
