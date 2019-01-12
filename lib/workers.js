/*
 * Worker-related tasks
 *
 */


// Dependencies
const path = require('path');
const fs = require('fs');
const datalib = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const logslib = require('./logs');

// Instantiate the worker object
var workers = {};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = function() {
  console.log('Gathering all checks');
  // Get all checks
  datalib.list('checks', function(err, checkIds) {
    if (err) {
      return console.error('Error getting checks:', err);
    }
    checkIds.forEach(function(checkId) {
      // Read in the check data
      datalib.read('checks', checkId, function(err, check) {
        if (err) {
          return console.err('Could not get check', err);
        }
        // Pass it to the check validator
        workers.validateCheck(check);
      });
    });
  });

};

// Sanity check the check data
workers.validateCheck = function(check) {
  // @TODO: assert that check is an object
  // @TODO: check.id is len 20
  // @TODO: check.url should be correct
  // @TODO: check.method should be valid
  // @TODO: check.successCodes should exist and should NOT be empty
  // @TODO: check.timeoutSeconds should be at least 1

  // Set the keys that may not be set by user (read only keys)
  check.state = check.state === 'up' ? 'up' : 'down';
  check.lastChecked = check.lastChecked || false;

  workers.performCheck(check);
};

workers.performCheck = function(check) {
  // Prepare the initial check outcome
  var outcome = {
    error: null,
    responseCode: false,
  };

  // Mark tha the outcome has not been sent yet
  var outcomeSent = false;

  // Parse the hostname and the path out of the original check
  const parsedUrl = url.parse(check.url);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  // Construct the request
  const requestDetails = {
    protocol: parsedUrl.protocol,
    hostname,
    method: check.method,
    path,
    timeout: check.timeoutSeconds * 1000,
  };

  var client = 'https:' === parsedUrl.protocol ? https : http;
  var req = client.request(requestDetails, function(res) {
    // Grab the status of the sent request
    const status = res.statusCode;

    // Update the outcome and pass the data along
    outcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // Bind to the error event so it does not ge thrown
  req.on('error', function(e) {
    outcome.error = {
      message: e,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout', function(e) {
    outcome.error = {
      message: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();

};

// Process the check outcome, update the check data as needed, trigger an alert
// if needed.
// Special logic for accomodating a check that has never been tested before
workers.processCheckOutcome = function(check, outcome) {
  // Decide if the check is considered up or down
  const state = !outcome.error && outcome.responseCode && check.successCodes.indexOf(outcome.responseCode) > -1 ? 'up' : 'down';

  // Decide if an alert is warranted
  var alertWarranted = check.lastChecked && check.state !== state;

  // Update the check data
  check.state = state;
  check.lastChecked = Date.now();

  workers.log(check, outcome, state, alertWarranted, Date.now());

  // Save updates
  datalib.update('checks', check.id, check, function(err) {
    if (err) {
      return console.err('Error updating check:', err);
    }
    // Send the new check data to the next phase in the process if needed
    if (alertWarranted) {
      workers.alertUserToStatusChange(check);
    } else {
      console.log(`Check ${check.id} (${check.method} ${check.url}) did not change`);
    }
  });
};

workers.alertUserToStatusChange = function(check) {
  console.log(`ALERT: Your check for ${check.method} ${check.url}) is ${check.state}`);
  // @TODO: notify via twilio SMS
};

workers.log = function(check, outcome, state, alert) {
  const now = Date.now();
  const log = {
    check,
    outcome,
    state,
    alert,
    time: Date.now(),
  }

  // Convert data to a string
  const line = JSON.stringify(log);

  // Determine the name of the log file
  const logFilename = check.id;

  // Append the log string to the file
  logslib.append(logFilename, line, function(err) {
    if (err) {
      return console.log('Logging to file failed');
    }
    console.log('Loging to file succeeded');
  })
};

// Timer to execute the worker-process once per minute
workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks();
  },5*1000);
};

// Timer to execute the log-rotation process once per day
workers.logRotationLoop = function() {
  setInterval(function() {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

// Rotate (compress) the log files
workers.rotateLogs = function() {
  console.log('Rotating logs...');
  // List all the (non compressed) log files
  logslib.list(false, function(err, filenames) {
    console.log(err, filenames);
    if (err) {
      return console.log('Could not list logs:', err);
    }
    if (filenames.length === 0) {
      // @TODO: is this if necessary????
      return console.log('Could not find any logs to rotate');
    }
    console.log(filenames);
    filenames.forEach(function(log) {
      // Compress the data to a different file
      const logId = path.basename(log, '.log');
      const newFileId = `${logId}-${Date.now()}`;
      logslib.compress(logId, newFileId, function(err) {
        if (err) {
          return console.log(`Error compressing '${logId}' into '${newFileId}': ${err}`);
        }
        logslib.truncate(logId, function(err) {
          if (err) {
            return console.log(`Error truncating log file '${logId}': ${err}`);
          }
          console.log(`Success truncating log file '${logId}'`);
        });
      });
    });
  });
};

// Init
workers.init = function() {
  // Execute all the checks inmediatly
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  // for example with a setInterval
  workers.loop();

  // Compress all the logs immediately
  workers.rotateLogs();

  // Call the compression loop so logs will be compressed later on
  workers.logRotationLoop();
};

// Export the module
module.exports = workers;
