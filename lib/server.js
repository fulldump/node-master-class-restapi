/*
 * Server related tasks
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Server object
var server = {};

// Main handler
server.mainHandler = function(req, res) {

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
    var handler = server.router[path];
    if (!handler) {
      handler = handlers.notFound;
    }

    // Construct data to send to the handler
    const data = {
      path,
      query,
      method,
      headers,
      payload: helpers.parseJsonObject(buffer),
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
      console.log(`${now.toUTCString()}\t${method}\t${path}\t${statusCode}\t(${payloadString.length}B)`);

    });

  })

};

server.httpsServerOptions = {
  key: fs.readFileSync(config.httpsKey),
  cert: fs.readFileSync(config.httpsCert),
};

// Init function
server.init = function() {
  // Instantiate & start the HTTP server
  server.httpServer = http.createServer(server.mainHandler);
  server.httpServer.listen(config.httpPort, function() {
    console.log(`The server is listening HTTP on port ${config.httpPort} now (${config.envName} environment)`);
  });

  // Instantiate & start the HTTPS server
  server.httpsServer = https.createServer(server.httpsServerOptions, server.mainHandler);
  server.httpsServer.listen(config.httpsPort, function() {
    console.log(`The server is listening HTTPS on port ${config.httpsPort} now (${config.envName} environment)`);
  })
};

server.router = {
  '/sample': handlers.sample,
  '/empty': handlers.empty,
  '/ping': handlers.ping,
  '/users': handlers.users,
  '/tokens': handlers.tokens,
  '/checks': handlers.checks,
}

module.exports = server;
