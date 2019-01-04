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

  // Get token from the headers
  var token = data.headers.token;
  console.log(token);
  if (!token) {
    return callback(400, {error: `Bad token`});
  }
  verifyToken(token, phone, function(valid) {
    if (!valid) {
      return callback(403, {error: `Not allowed`});
    }

    // Lookup the user
    datalib.read('users', phone, function(err, data) {
      if (err) {
        console.log(err);
        return callback(400, {error:`User with phone '${phone}' not found`});
      }
      delete data.password;
      callback(200, data);
    });
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

  // Get token from the headers
  var token = data.headers.token;
  if (!token) {
    return callback(400, {error: `Bad token`});
  }
  verifyToken(token, phone, function(valid) {
    if (!valid) {
      return callback(403, {error: `Not allowed`});
    }

    // Store new updates
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

  // Get token from the headers
  var token = data.headers.token;
  if (!token) {
    return callback(400, {error: `Bad token`});
  }
  verifyToken(token, phone, function(valid) {
    if (!valid) {
      return callback(403, {error: `Not allowed`});
    }
    // Delete the user
    datalib.delete('users', phone, function(err) {
      if (err) {
        console.log(err);
        return callback(400, {error:`User with phone '${phone}' not found`});
      }
      callback(200);
    });
  });
};

// Sub router handler for tokens
handlers.tokens = function(data, callback) {
  switch (data.method) {
    case 'POST':
      handlers.createToken(data, callback);
      break;
    case 'GET':
      handlers.getToken(data, callback);
      break;
    case 'PUT':
      handlers.updateToken(data, callback);
      break;
    case 'DELETE':
      handlers.deleteToken(data, callback);
      break;
    default:
      callback(405);
  }
};

// Token - POST
// Required data: phone, password
// Optional data: none
handlers.createToken = function(data, callback) {

  const payload = data.payload;

  // Validate structure
  const schema = {
    phone: 'string,required',
    password: 'string, required',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  datalib.read('users', payload.phone, function(err, user) {
    if (err) {
      console.error(err);
      return callback(500, {error: 'Could not read from persistence layer.'})
    }
    if (user.password !== helpers.hash(payload.password)) {
      return callback(401, {error: 'Invalid password or phone number.'})
    }
    // Here user is authenticated, so create a new token with a random name.
    // and set expiration date 1 hour in advance.
    var token = {
      id: helpers.createRandomString(20),
      phone: payload.phone,
      expires: Date.now() + 60*60*1000, // 1h,
    };

    // Store the token
    datalib.create('tokens', token.id, token, function(err) {
      if (err) {
        return callback(500, {error: 'Unexpected error writing to persistence layer.'});
      }
      callback(200, token);
    })
  });
};

// Token - GET
// Required data: id
// Optional data: none
handlers.getToken = function(data, callback) {
  const id = data.query.id;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  datalib.read('tokens', id, function(err, token) {
    if (err) {
      return callback(500, 'Unexpected error reading from persistence layer');
    }
    callback(200, token);
  });
};

// Token - PUT
// Required data: id, extend
// Optional data: none
handlers.updateToken = function(data, callback) {

  const id = data.query.id;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  // Validate extends
  if (data.query.extend !== "true") {
    return callback(400, {error: 'Parameter "extend" should be "true"'})
  }

  datalib.read('tokens', id, function(err, token) {
    if (err) {
      return callback(500, {error: 'Unexpected error reading from persistence layer'});
    }
    if (token.expires < Date.now()) {
      return callback(400, {error: 'Token do not exists'});
    }

    token.expires = Date.now() + 60*60*1000; // 1h more from now

    datalib.update('tokens', id, token, function(err) {
      if (err) {
        return callback(500, {error: 'Unexpected error writing to persistence layer'})
      }
      callback(200);
    });
  });

};

// Token - DELETE
// Required data: id
// Optional data: none
handlers.deleteToken = function(data, callback) {

  const id = data.query.id;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  // Delete token
  datalib.delete('tokens', id, function(err) {
    if (err) {
      console.log(err);
      return callback(400, {error:`Token id '${id}' not found`});
    }
    callback(200);
  });
};

// Verify if a given token id is currently valid for a given user
function verifyToken(id, phone, callback) {
  // Lookup the token
  datalib.read('tokens', id, function(err, token) {
    if (err) {
      return callback(false);
    }
    if (token.phone !== phone) {
      return callback(false);
    }
    if (token.expires < Date.now()) {
      return callback(false);
    }
    callback(true);
  });
};

module.exports = handlers;
