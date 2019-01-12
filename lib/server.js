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
const util = require('util');
const debug = util.debuglog('server');

// Server object
function Server() {

  // Initialize default config
  this.setConfig({
    httpPort: 3000,
    httpsPort: 3001,
    httpsKey: '',
    httpsCert: '',
  });

  //
};

Server.prototype.start = function() {

  const config = this.config;

  // Instantiate & start the HTTP server
  const httpServer = http.createServer(this.mainHandler);
  httpServer.listen(config.httpPort, function() {
    console.log('\x1b[35m%s\x1b[0m', `The server is listening HTTP on port ${config.httpPort}.`);
  });

  // Instantiate & start the HTTPS server
  if (config.httpsKey && config.httpsCert) {
    const httpsServerOptions = {
      key: fs.readFileSync(config.httpsKey),
      cert: fs.readFileSync(config.httpsCert),
    };
    const httpsServer = https.createServer(httpsServerOptions, this.mainHandler);
    httpsServer.listen(config.httpsPort, function() {
      console.log('\x1b[36m%s\x1b[0m', `The server is listening HTTPS on port ${config.httpsPort}.`);
    });
  }
};

Server.prototype.setConfig = function(config) {
  this.config = config;
  // @TODO: sanitize config
};

// Main handler
Server.prototype.mainHandler = function(req, res) {

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
      const line = `${now.toUTCString()}\t${method}\t${path}\t${statusCode}\t(${payloadString.length}B)`;
      if (200 == statusCode) {
        debug('\x1b[32m%s\x1b[0m', line);
      } else {
        debug('\x1b[31m%s\x1b[0m', line);
      }

    });
  });
};

const router = {
  '/sample': handlers.sample,
  '/empty': handlers.empty,
  '/ping': handlers.ping,
  '/users': handlers.users,
  '/tokens': handlers.tokens,
  '/checks': handlers.checks,
}

module.exports = {
  Server,
};
