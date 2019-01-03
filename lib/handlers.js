/*
 * Request handlers
 *
 */


// Dependencies
const datalib = require('./data');
const helpers = require('./helpers');

// Handlers zone
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

handlers.ping = function(data, callback) {
  callback(200);
};

// Sub router handler
handlers.users = function(data, callback) {
  switch (data.method) {
    case 'POST':
      handlers.createUser(data, callback);
      break;
    case 'GET':
      handlers.getUser(data, callback);
      break;
    case 'PUT':
      handlers.updateUser(data, callback);
      break;
    case 'DELETE':
      handlers.deleteUser(data, callback);
      break;
    default:
      callback(405);
  }
};

// Users - POST
// Required data: firstName, lastName, phone, password, tosAggrement
// Optional data: none
handlers.createUser = function(data, callback) {

  const payload = data.payload;

  // Validate structure
  const schema = {
    firstName: 'string,required',
    lastName: 'string,required',
    phone: 'string,required',
    password: 'string,required',
    tosAgreement: 'boolean,required',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  // Validate extra logic
  if (payload.phone.length != 10) {
    return callback(400, {error: 'Phone number should be 10 chars length.'});
  }
  if (payload.tosAgreement !== true) {
    return callback(400, {error: 'Terms Of Service should be accepted (true)'});
  }

  datalib.read('users', payload.phone, function(err, data) {
    if (!err) {
      // User already exists
      return callback(409, {error: `User with phone number '${payload.phone}' already exists.`});
    }
    // Hash the password
    payload.password = helpers.hash(payload.password);

    datalib.create('users', payload.phone, payload, function(err) {
      if (err) {
        console.log(err);
        return callback(500, {error: 'Unexpected error happend storing the user'});
      }
      callback(200, payload);
    });
  })
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object.
handlers.getUser = function(data, callback) {
  // @TODO Check the phone number is valid
  var phone = data.query.phone;
  if (!phone) {
    return callback(400, {error:`Missing required query param 'phone'.`})
  }
  datalib.read('users', phone, function(err, data) {
    if (err) {
      console.log(err);
      return callback(400, {error:`User with phone '${phone}' not found`});
    }
    delete data.password;
    callback(200, data);
  });
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO: do not allow a user updating other user
handlers.updateUser = function(data, callback) {

  const payload = data.payload;

  // Validate structure
  const schema = {
    firstName: 'string',
    lastName: 'string',
    phone: 'string,required',
    password: 'string',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  datalib.read('users', payload.phone, function(err, user) {
    if (err) {
      return callback(500, {error: 'Unexpected error reading from persistence.'});
    }
    if (payload.firstName) {
      user.firstName = payload.firstName;
    }
    if (payload.lastName) {
      user.lastName = payload.lastName;
    }
    if (payload.password) {
      user.password = helpers.hash(payload.password);
    }

    datalib.update('users', payload.phone, user, function(err) {
      if (err) {
        return callback(500, {error: 'Unexpected error writing to persistence.'});
      }
      callback(200);
    });
  });
};

// Users - delete
// Required field: phone
// @TODO only let auth user delete their object.
// @TODO: cleanup any other data files related to this user.
handlers.deleteUser = function(data, callback) {
  // @TODO Check the phone number is valid
  var phone = data.query.phone;
  if (!phone) {
    return callback(400, {error:`Missing required query param 'phone'.`})
  }
  datalib.delete('users', phone, function(err) {
    if (err) {
      console.log(err);
      return callback(400, {error:`User with phone '${phone}' not found`});
    }
    callback(200);
  });
};

module.exports = handlers;
