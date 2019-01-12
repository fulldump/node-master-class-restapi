/*
 * Request handlers
 *
 */


// Dependencies
const datalib = require('./data');
const helpers = require('./helpers');
// const url = require('url');

/*
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
    password: 'string,required',
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

// Retrieve a token from header
function getToken(tokenId, callback) {
  if (!tokenId) {
    return callback({error: 'Header token not provided'}, null);
  }
  // Lookup the token
  datalib.read('tokens', tokenId, function(err, token) {
    if (err) {
      return callback({error: 'Could not read from persistence layer'}, null);
    }
    if (token.expires < Date.now()) {
      return callback({error: 'Expired token'}, null);
    }
    callback(null, token);
  });
};

// Sub router handler for checks
handlers.checks = function(data, callback) {
  switch (data.method) {
    case 'POST':
      handlers.createCheck(data, callback);
      break;
    case 'GET':
      handlers.getCheck(data, callback);
      break;
    case 'PUT':
      handlers.updateCheck(data, callback);
      break;
    case 'DELETE':
      handlers.deleteCheck(data, callback);
      break;
    default:
      callback(405);
  }
};

// Checks - POST
// Maximum 5 checks
// Required data: url, method, successCodes, timeoutSeconds
// Optional data: none
handlers.createCheck = function(data, callback) {

  const payload = data.payload;

  // Validate structure
  const schema = {
    url: 'string,required',
    method: 'string,required',
    successCodes: 'object,required',
    timeoutSeconds: 'number,required',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    return callback(400, {error: invalidPayload});
  }

  // Validate url (try to parse)
  const parsedUrl = url.parse(payload.url);
  if (!parsedUrl) {
    return callback(400, {error: 'Url should have a valid host'});
  }

  // Get token from the headers
  getToken(data.headers.token, function(err, token) {
    if (err) {
      return callback(403, err);
    }
    datalib.read('users', token.phone, function(err, user) {
      if (err) {
        return callback(500, {error: 'Could not read from persistence layer'});
      }
      user.checks = user.checks || []; // Sanitize checks
      // Verify the user has the max checks per user
      if (user.checks.length >= config.maxChecks) {
        return callback(400, {error: `You already reached the maximum number of checks (${config.maxChecks})`});
      }
      // Create a check:
      var check = payload; // Not copy needed
      check.id = helpers.createRandomString(20);
      check.userPhone = user.phone;

      // Save the object
      datalib.create('checks', check.id, check, function(err) {
        if (err) {
          return callback(500, {error: 'Could not create the new check'});
        }

        // Add the check id to user's object
        user.checks.push(check.id);

        // Save the new user data
        datalib.update('users', user.phone, user, function(err) {
          if (err) {
            return callback(500, {error: 'Could not update the user with the new check'});
          }
          callback(200, check);
        });
      })
    });
  });
};

// Checks - GET
// Required data: id
// Optional data: none
handlers.getCheck = function(data, callback) {

  const id = data.query.id;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  // Lookup the check
  datalib.read('checks', id, function(err, check) {
    if (err) {
      console.error(err);
      return callback(404, {error:`Check '${id}' not found or unexpected error reading from persistence layer.`});
    }
    // Verify that curren token is valid and check belongs to the user
    console.log('check:',check);
    verifyToken(data.headers.token, check.userPhone, function(valid) {
      if (!valid) {
        return callback(403, {error: 'Header `token` is not valid'});
      }
      callback(200, check);
    });
  });
};

// Checks - PUT
// Required data: id
// Optional data: url, method, successCodes, timeoutSeconds (one must be sent - or not )
handlers.updateCheck = function(data, callback) {

  const payload = data.payload;

  const id = data.query.id;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  // Validate structure
  const schema = {
    url: 'string',
    method: 'string',
    successCodes: 'object',
    timeoutSeconds: 'number',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  // Lookup check
  datalib.read('checks', id, function(err, check) {
    if (err) {
      return callback(404, {error:`Check '${id}' not found or can not read from persistence layer.`});
    }

    verifyToken(data.headers.token, check.userPhone, function(valid) {
      if (!valid) {
        return callback(403, {error: 'Header `token` is not valid'});
      }
      // Update check object with all existing fields from payload. Note that
      // all payload fields are already validated and can only be those four.
      for (field in payload) {
        check[field] = payload[field];
      }

      datalib.update('checks', id, check, function(err) {
        if (err) {
          return callback(500, {error: 'Unexpected error writing data to persistence layer'});
        }
        callback(200);
      });
    });
  });
};

// Checks - DELETE
// Required data: id
// Optional data: none
handlers.deleteCheck = function(data, callback) {

  const id = data.query.id;
  // Validate id
  const validId = /^[a-z0-9]{20}$/.test(id);
  if (!validId) {
    return callback(400, {error: 'Invalid Id'});
  }

  // Lookup the check
  datalib.read('checks', id, function(err, check) {
    if (err) {
      return callback(404, {error:`Check '${id}' not found or can not read from persistence layer.`});
    }
    verifyToken(data.headers.token, check.userPhone, function(valid) {
      if (!valid) {
        return callback(403, {error: 'Header `token` is not valid'});
      }

      // Delete the check
      datalib.delete('checks', id, function(err) {
        if (err) {
          return callback(500, {error: `Could not delete check '${check.id}'`})
        }

        // Lookup the user
        datalib.read('users', check.userPhone, function(err, user) {
          if (err) {
            return callback(500, {error: `Could not read user '${check.userPhone}' from persistence layer`});
          }
          // Remove the deleted check from the list of checks
          user.checks = user.checks.filter(id => id != check.id);
          datalib.update('users', user.phone, user, function(err) {
            if (err) {
              return callback(500, {error: `Could not remove theck '${check.id}' from user '${user.phone}'`});
            }
            callback(200);
          });
        });
      });
    });
  });
};

*/

// Errors
const ErrorPersistenceRead = {error: `Unexpected error reading from persistence layer`};
const ErrorPersistenceWrite = {error: `Unexpected error writing to persistence layer`};

// list all user ids
function listUsers(req, callback) {
  datalib.list('users', function(err, userIds) {
    if (err) {
      console.error(err);
      return callback(500, ErrorPersistenceRead);
    }
    callback(200, userIds);
  });
}

listUsers.documentation = `
List all users. You should be administrator.

Example:
´´´
curl -i http://localhost:3000/users
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 21:03:47 GMT
Connection: keep-alive
Transfer-Encoding: chunked

[
    "fulanez@email.com",
    "menganez@email.com",
    "zutanez@email.com"
]
´´´
`;

// Create a user
function createUser(req, callback) {

  const payload = req.payload;

  // Validate structure
  const schema = {
    email: 'string,required',
    name: 'string,required',
    address: 'string,required',
    age: 'number',
    phone: 'string',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    return callback(400, {error: invalidPayload});
  }

  // Sanitize user
  var user = payload; // @TODO: not making a copy
  user.createTimestamp = Date.now();

  // Create user
  datalib.create('users', user.email, user, function(err) {
    if (err) {
      // @TODO: distinguish between 'already exists'
      return callback(500, ErrorPersistenceWrite);
    }
    callback(200, user);
  });

}

createUser.documentation =  `
Create a new user.
Required fields: email, name, address
Optional fields: age, phone
`;

// Retrieve a user by email
function retrieveUser(req, callback) {

  // @TODO Security risk: We are passing a client string to filesystem which is
  // totally insecure!
  const userEmail = req.parameters.userEmail;

  // Lookup the user
  datalib.read('users', userEmail, function(err, user) {
    if (err) {
      // @TODO: check when the user does not exist or is an io error!
      console.log(err);
      return callback(400, {error:`User with email '${email}' not found`});
    }
    callback(200, user);
  });

}

retrieveUser.documentation = `
Retrieve a user by email.

Example:
´´´
curl -i  http://localhost:3000/users/fulanez@email.com
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:29:49 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanez@email.com",
    "name": "Fulanez",
    "address": "Elm street 75",
    "createTimestamp": 1547325441677
}
´´´
`;

// PATCH /users/{userEmail}
// Update a user by email
// Required data: userEmail (url parameter)
// Optional data: name, address (body json)
function updateUser(req, callback) {

  // @TODO Security risk: We are passing a client string to filesystem which is
  // totally insecure!
  const userEmail = req.parameters.userEmail;

  const payload = req.payload;

  // Validate structure
  const schema = {
    name: 'string',
    address: 'string',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  // Lookup user
  datalib.read('users', userEmail, function(err, user) {
    if (err) {
      return callback(500, {error: 'Unexpected error reading from persistence (or user not found).'});
    }

    // Overwrite all information from payload into user object
    for (var k in payload) {
      user[k] = payload[k];
    }

    // Refresh update timestamp
    user.updateTimestamp = Date.now();

    // Store new user
    datalib.update('users', userEmail, user, function(err) {
      if (err) {
        return callback(500, ErrorPersistenceWrite);
      }
      callback(200, user);
    });
  });
}

updateUser.documentation = `
Update a user by email with path ´/users/{userEmail}´.

Allowed fields to update:
* ´name´
* ´address´

Example:
´´´
curl -i -X PATCH http://localhost:3000/users/fulanez@email.com \
-d '{"address": "Elm street 3"}'
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:44:07 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanez@email.com",
    "name": "Fulanez",
    "address": "Elm street 3",
    "createTimestamp": 1547325441677,
    "updateTimestamp": 1547333047445
}
´´´
`;

// DELETE /users/{userEmail}
// Update a user by email
// Required data: userEmail (url parameter)
// Optional data: none
function deleteUser(req, callback) {

  // @TODO Security risk: We are passing a client string to filesystem which is
  // totally insecure!
  const userEmail = req.parameters.userEmail;

  // Lookup user
  datalib.read('users', userEmail, function(err, user) {
    if (err) {
      return callback(500, {error: `User with email '${userEmail}' not found.`});
    }

    // Delete the user
    datalib.delete('users', userEmail, function(err) {
      if (err) {
        console.log(err);
        return callback(400, ErrorPersistenceWrite);
      }
      callback(200, user);
    });
  });
}

deleteUser.documentation = `
Delete a user by email.

Notice the user is returned back, just in case of error that information
could be inserted again.

Example:
´´´
curl -i -X DELETE http://localhost:3000/users/zutanez@email.com
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:55:53 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "zutanez@email.com",
    "name": "Zutanez",
    "address": "Elm street 75",
    "createTimestamp": 1547325503128
}
´´´
`;

module.exports = {
  listUsers,
  createUser,
  retrieveUser,
  updateUser,
  deleteUser,
};
