/*
 * Library for storing and editing data
 *
 */

 // Dependencies
 const fs = require('fs');
 const path = require('path');
 const helpers = require('./helpers');

 // Container for this module
 var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Helper to build paths
lib.getFilename = function(dir, file) {
  return path.join(lib.baseDir, `/${dir}/${file}.json`);
};

// Write data to a file
lib.create = function(dir, file, data, callback) {
  const filename = lib.getFilename(dir, file);

  // Open the file for writing
  fs.open(filename, 'wx', function(err, fd) {
    if (err) {
      callback('Could not create new file');
      console.log(err);
      return;
    }

    // Convert data to string
    const stringData = JSON.stringify(data); //TODO: handle errors?

    // Write to file and close it
    fs.writeFile(fd, stringData, function(err) {
      if (err) {
        return callback('Error writing to new file' + err);
      }

      fs.close(fd, function(err) {
        if (err) {
          return callback('Error closing new file' + err);
        }
        callback(); // All was ok
      });
    });
  });
};

// Read data from a file
lib.read = function(dir, file, callback) {
  const filename = lib.getFilename(dir, file);

  fs.readFile(filename, 'utf-8', function(err, data) {
    callback(err, helpers.parseJsonObject(data));
  });
};

// Update data inside a file
lib.update = function(dir, file, data, callback) {
  const filename = lib.getFilename(dir, file);

  fs.open(filename, 'r+', function(err, fd) {
    if (err) {
      return callback('Could not open the file for updationg'+err);
    }

    fs.truncate(fd, function(err) {
      if (err) {
        return callback('Error truncating file' + err);
      }

      // Convert data to string
      const stringData = JSON.stringify(data); //TODO: handle errors?

      fs.writeFile(fd, stringData, function(err) {
        if (err) {
          callback('Error writing to existing file'+err);
        }
        fs.close(fd, function(err) {
          if (err) {
            return callback('Error closing existing file');
          }
          callback(); // Success !!
        });
      });
    });
  });
};

// Delete a file
lib.delete = function(dir, file, callback) {
  const filename = lib.getFilename(dir, file);
  fs.unlink(filename,function(err) {
    if (err) {
      return callback('Error deleting file' + err);
    }
    callback(); // Success !!
  });
};


// Export the module
module.exports = lib;
