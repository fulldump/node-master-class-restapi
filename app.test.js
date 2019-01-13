/**
 * Tests for router
*/

// Dependencies
const app = require('./app');
const testing = require('./lib/testing');
const https = require('https');
const http = require('http');
const url = require('url');
const helpers = require('./lib/helpers');

// Initialize suite
var suite = new testing.Suite();

// Testing helpers
function makeRequest(method, uri, headers, body) {

  headers = headers || {};
  body = body || '';
  if (!(typeof body == 'string')) {
    body = JSON.stringify(body);
  }

  return new Promise(function(resolve, reject) {
    const parsedUrl = url.parse(uri);

    const requestDetails = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      method,
      headers,
      path: parsedUrl.path,
      timeout: 2 * 1000, // @TODO: hardcoded value
    };


    var client = 'https:' === parsedUrl.protocol ? https : http;
    var req = client.request(requestDetails, function(res) {
      // Configure encoding
      res.setEncoding('utf8');

      // Collect body
      var payload = '';
      res.on('data', function(chunk) {
        payload += chunk;
      })
      res.on('end', function() {
        try {
          payload = JSON.parse(payload);
        } catch (e) {

        }
        res.payload = payload;
        resolve(res);
      });
    });

    // Bind to the error event so it does not ge thrown
    req.on('error', reject);

    // Bind to the timeout event
    req.on('timeout', reject);

    // End the request
    req.end(body, 'utf8');

  });
}

// Write all tests cases

suite.addAsync(function CrudUsers(t) {

  const userEmail = helpers.createRandomString(10) + '@email.com';

  makeRequest('POST', 'http://localhost:3000/users', {}, {
    name: 'Fulanez',
    email: userEmail,
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
    t.deepEqual(res.statusCode, 200);

    makeRequest('GET', 'http://localhost:3000/users/'+userEmail)
    .then(function(res) {
      var user = res.payload;
      t.deepEqual(user, expectedUser);
      t.deepEqual(res.statusCode, 200);
      t.done();
    })
    .catch(function() {
      t.done();
    });

  }, function(err) {
    t.fail(err);
    t.done();
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
