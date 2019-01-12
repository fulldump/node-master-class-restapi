/*
 * Server related tasks
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const util = require('util');
const debug = util.debuglog('server');
const router = require('./router');

// Server object
function Server() {

  // Initialize default config
  this.setConfig({
    httpPort: 3000,
    httpsPort: 3001,
    httpsKey: '',
    httpsCert: '',
  });

  // Initialize router
  this.router = new router.Router();

  // Declare servers (just informative)
  this.httpServer = null;
  this.httpsServer = null;
};

// Start http and https servers giving a router
Server.prototype.start = function() {

  const config = this.config;
  const server = this;

  // This bind mainHandler to server object
  var handler = function(req, res) {
    server.mainHandler(req, res);
  };

  // Instantiate & start the HTTP server
  this.httpServer = http.createServer(handler);
  this.httpServer.listen(config.httpPort, function() {
    console.log('\x1b[35m%s\x1b[0m', `HTTP server is listening on port ${config.httpPort}.`);
  });

  // Instantiate & start the HTTPS server
  if (config.httpsKey && config.httpsCert) {
    const httpsServerOptions = {
      key: fs.readFileSync(config.httpsKey),
      cert: fs.readFileSync(config.httpsCert),
    };
    this.httpsServer = https.createServer(httpsServerOptions, handler);
    this.httpsServer.listen(config.httpsPort, function() {
      console.log('\x1b[36m%s\x1b[0m', `HTTPS server is listening on port ${config.httpsPort}.`);
    });
  }
};

Server.prototype.stop = function() {
  var that = this;
  return Promise.all([
    new Promise(function(resolve, reject) {
      if (!that.httpServer) {
        return resolve();
      }
      that.httpServer.close(function() {
        console.log(`HTTP server stopped`);
        resolve(that.httpServer);
      });
      that.httpServer = null;
    }),
    new Promise(function(resolve, reject) {
      if (!that.httpsServer) {
        return resolve();
      }
      that.httpsServer.close(function() {
        console.log(`HTTPS server stopped`);
        resolve(that.httpsServer);
      });
      that.httpsServer = null;
    }),
  ]);
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

  // Get handler from router. It will always return a handler. If something
  // is not going well, it will return a 404 Not Found (if path do not match)
  // or a 405 Method not allowed (if method is not defined).
  const handler = this.router.match(method, path);

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

module.exports = {
  Server,
};
