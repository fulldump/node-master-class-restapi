/**
 * Tests for router
*/

// Dependencies
const router = require('./router');
const testing = require('./testing');

// Initialize suite
var suite = new testing.Suite();

// Write all tests cases

suite.add(function MatchStaticPath(t) {
  var r = new router.Router();

  var handler = function(request, callback) {};

  r.path('/users')
    .method('GET', handler);

  // Happy path
  t.deepEqual(r.match('GET', '/users'), handler);

  // Undefined method
  t.deepEqual(r.match('POST', '/users'), router.handlerMethodNotAllowed);

  // Undefined path
  t.deepEqual(r.match('GET', '/invented'), router.handlerNotFound);
});

suite.add(function MatchWilcardMethod(t) {
  var r = new router.Router();

  var handler = function(request, callback) {};

  r.path('/users')
    .method('POST', function() {})
    .method('*', handler);

  // Happy path
  t.deepEqual(r.match('DELETE', '/users'), handler);

});

suite.add(function DocumentMethod(t) {
  var r = new router.Router();

  var handler = function() {};
  var doc = `
    This endpoint will create a user
  `;

  r.path('/users')
    .method('POST', handler, doc);

  // Happy path
  t.deepEqual(r.match('POST', '/users').documentation, doc);

});

suite.add(function ReplaceDefaultNotFound(t) {
  var r = new router.Router();
  var myCustomNotFound = function(){};
  r.handlerNotFound = myCustomNotFound;

  t.deepEqual(r.match('GET', '/something'), myCustomNotFound);
});

suite.add(function ReplaceDefaultMethodNotAllowed(t) {
  var r = new router.Router();
  r.path('/my-resource')
  var myCustomMethodNotAllowed = function(){};
  r.handlerMethodNotAllowed = myCustomMethodNotAllowed;

  t.deepEqual(r.match('GET', '/my-resource'), myCustomMethodNotAllowed);
});

suite.add(function MatchUrlParams(t) {
  var r = new router.Router();

  var myHandler = function() {};

  r.path('/users/{userId}/history').method('GET', myHandler);

  var params = {};
  r.match('GET', '/users/fulanez@email.com/history', params);
  t.deepEqual(params, {userId: 'fulanez@email.com'});
});

// Run suite
suite.run();
