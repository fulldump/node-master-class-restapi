/*
 * Library for storing and rotating logs
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Container for the module
var lib = {};

// Base directory
lib.baseDir = path.join(__dirname, '../.logs/');

// Append a string to a file. Create the file if it does not exist.
lib.append = function(file, str, callback) {
  // Open the file for appending
  fs.open(path.join(lib.baseDir, file+'.log'), 'a', function(err, fd) {
    if (err) {
      return callback(`Could not open file '${file}' for appending: ${err}`);
    }
    fs.appendFile(fd, str+'\n', function(err) {
      if (err) {
        return callback('Error appending to file:', err);
      }
      fs.close(fd, function(err) {
        if (err) {
          return callback('Error closing the file while appending:', err);
        }
        callback();
      });
    });
  });
};

// List all the logs and optionally include the compressed logs
lib.list = function(includeCompressedLogs, callback) {
  fs.readdir(lib.baseDir, function(err, data) {
    if (err) {
      return callback('Could not list logs:', err);
    }
    var trimmedFilenames = data.filter(filename => {
      const ext = path.extname(filename).toLowerCase();
      return '.log' == ext || '.gz.b64' && includeCompressedLogs;
    });
    callback(null, trimmedFilenames);
  });
};

// ompress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function(logId, newFileId, callback) {
  const source = path.join(lib.baseDir, logId + '.log');
  const dest = path.join(lib.baseDir, newFileId+'.gz.b64');

  // Read the source file
  fs.readFile(source, 'utf8', function(err, inputString) {
    if (err) {
      return callback(err);
    }
    // Cmpress the data using gzip
    zlib.gzip(inputString, function(err, buffer) {
      if (err) {
        return callback(err);
      }
      // Send the data to the destination file
      fs.open(dest, 'wx', function(err, fd) {
        if (err) {
          return callback(err);
        }
        // Write to the destination file
        fs.writeFile(fd, buffer.toString('base64'), function(err) {
          if (err) {
            return callback(err);
          }
          // Close the destination file
          fs.close(fd, function(err) {
            if (err) {
              return callback(err);
            }
            callback();
          })
        })
      });
    });
  });
};

// Decompress the contents of a .gz.b64 into a string variable
lib.decompress = function(fileId, callback) {
  var filename = join(lib.baseDir, fileId+'.gz.b64');
  fs.readFile(filename, 'utf8', function(err, str) {
    if (err) {
      return callback(err);
    }
    // Decompress the data
    var inputBuffer = Buffer.from(str, 'base64');
    zlib.unzip(inputBuffer, function(err, outputBuffer) {
      if (err) {
        return callback(err);
      }
      // Callback
      var str = outputBuffer.toString();
      callback(null, str);
    });
  });
};

// Truncate a log file
lib.truncate = function(logId, callback) {
  const filename = path.join(lib.baseDir, logId+'.log');
  fs.truncate(filename, 0, function(err){
    if (err) {
      return callback(err);
    }
    callback(err);
  });
};

// Export lib
module.exports = lib;
