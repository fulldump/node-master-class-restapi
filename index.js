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

    // Send the response
    res.end('Hello World\n');

    // Access log
    console.log(`${now.toUTCString()}\t${method}\t${path}`);
  })

});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
  console.log("The server is listening on port 3000 now");
});
