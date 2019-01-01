/*
 * Primary file for the API
 */

// Dependencies
const http = require('http');
const url = require('url');

// The server should responde to all requests with a string
const server = http.createServer(function(req, res) {

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path from the url
  const path = parsedUrl.pathname;

  // Send the response
  res.end('Hello World\n');

  // Log path
  console.log(new Date(), path);
});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
  console.log("The server is listening on port 3000 now");
});
