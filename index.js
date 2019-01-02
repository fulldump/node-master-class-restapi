/*
 * Primary file for the API
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should responde to all requests with a string
const server = http.createServer(function(req, res) {

  // Get request method
  const method = req.method.toUpperCase();

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true); // true is parsing query string

  // Get the path from the url
  const path = parsedUrl.pathname;

  // Get the query string as an object
  const query = parsedUrl.query;

  // Get headers as an object
  const headers = req.headers;

  // Get current time
  const now = new Date();

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use
    // the notFound handler
    var handler = router[path];
    if (!handler) {
      handler = handlers.notFound;
    }

    // Construct data to send to the handler
    const data = {
      path,
      query,
      method,
      headers,
      payload: buffer,
    };

    handler(data, function(statusCode, payload) {

      // use payload or default to empty object
      var payloadString = '';
      if (payload) {
        res.setHeader('Content-Type', 'application/json');
        // Convert the payload to string
        payloadString = JSON.stringify(payload,null,4)+'\n';
      } else {
        statusCode = statusCode || 204;
      }

      // use the status code or default to 200
      statusCode = statusCode || 200;

      // Return response
      res.writeHead(statusCode);
      res.end(payloadString);

      // Access log
      console.log(`${now.toUTCString()}\t${method}\t${path} (${payloadString.length}B)`);

    });

  })

});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
  console.log("The server is listening on port 3000 now");
});

var handlers = {};

handlers.sample = function(data, callback) {
  callback(406, {'name': 'sample handler'});
};

handlers.notFound = function(data, callback) {
  callback(404);
};

handlers.empty = function(data, callback) {
  callback();
};

var router = {
  '/sample': handlers.sample,
  '/empty': handlers.empty,
}
