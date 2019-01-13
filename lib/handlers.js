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

*/

// Errors
const ErrorPersistenceRead = {error: `Unexpected error reading from persistence layer`};
const ErrorPersistenceWrite = {error: `Unexpected error writing to persistence layer`};

// GET /users
// List all user ids
// Required data: none
// Optional data: none
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

// POST /users
// Create a new user
// Required data: email, password, name, address
// Optional data: age, phone
function createUser(req, callback) {

  const payload = req.payload;

  // Validate structure
  const schema = {
    email: 'string,required',
    password: 'string,required',
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
  user.__passwordHash = helpers.hash(user.password);
  delete user.password;

  // Create user
  datalib.create('users', user.email, user, function(err) {
    if (err) {
      // @TODO: distinguish between 'already exists'
      return callback(500, ErrorPersistenceWrite);
    }
    callback(201, user);
  });

}
createUser.documentation =  `
Create a new user.

Required fields:
* ´email´
* ´name´
* ´address´

Optional fields:
* ´age´
* ´phone´

Example:

´´´
curl -i http://localhost:3000/users -d \
'{"email":"fulanito@email.com", "name":"Fulanez", "address":"Elm street 33"}'
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 00:25:56 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanito@email.com",
    "name": "Fulanez",
    "address": "Elm street 33",
    "createTimestamp": 1547339156046
}
´´´
`;

// GET /users/{userEmail}
// Retrieve a user by email
// Required data: userEmail (url parameter)
// Optional data: none
function retrieveUser(req, callback) {

  // @TODO Security risk: We are passing a client string to filesystem which is
  // totally insecure!
  const userEmail = req.parameters.userEmail;

  // Lookup the user
  datalib.read('users', userEmail, function(err, user) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(404, {error:`User with email '${userEmail}' not found`});
      }
      console.log(err);
      return callback(500, ErrorPersistenceRead);
    }
    callback(200, user);
  });
}
retrieveUser.documentation = `
Retrieve a user by email.

Required fields:
* ´email´

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
    age: 'number',
    phone: 'string',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  // Lookup user
  datalib.read('users', userEmail, function(err, user) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(404, {error:`User with email '${userEmail}' not found`});
      }
      console.log(err);
      return callback(500, ErrorPersistenceRead);
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
Update a user by email.

Required fields:
* ´email´ (string)

Optional fields:
* ´name´ (string)
* ´address´ (string)
* ´age´ (number)
* ´phone´ (string)

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
      if (err.code === 'ENOENT') {
        return callback(404, {error:`User with email '${userEmail}' not found`});
      }
      console.error(err);
      return callback(500, ErrorPersistenceRead);
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

// POST /tokens
// Create a new token
// Required data: email, password
// Optional data: none
function createToken(data, callback) {

  const payload = data.payload;

  // Validate structure
  const schema = {
    email: 'string,required',
    password: 'string,required',
  };
  const invalidPayload = helpers.validate(schema, payload);
  if (invalidPayload) {
    callback(400, {error: invalidPayload});
    return;
  }

  // Get email and password
  const email = payload.email;
  const password = payload.password;

  datalib.read('users', email, function(err, user) {
    if (err) {
      if (err.code === 'ENOENT') {
        // @TODO: Maybe we are disclosing too much information with that message
        return callback(404, {error:`User with email '${email}' not found`});
      }
      console.log(err);
      return callback(500, ErrorPersistenceRead);
    }
    if (user.__passwordHash !== helpers.hash(password)) {
      return callback(401, {error: 'Bad password'})
    }

    // Here user is authenticated, so create a new token with a random name.
    // and set expiration date 1 hour in advance.
    var token = {
      id: helpers.createRandomString(20),
      email,
      expires: Date.now() + 60*60*1000, // @TODO: hardcoded 1h
    };

    // Store the token
    datalib.create('tokens', token.id, token, function(err) {
      if (err) {
        return callback(500, ErrorPersistenceWrite);
      }
      callback(201, token);
    });
  });
}
createToken.documentation = `
Login a user into the system creating a token valid for a short period of life
(1h by default).

Required fields:
* ´tokenId´ (url parameter)

Optional fields: none

Example:

´´´
curl -i http://localhost:3000/tokens \
-d '{"email":"59m58tgj06@email.com", "password":"123456"}'
HTTP/1.1 201 Created
Content-Type: application/json
Date: Sun, 13 Jan 2019 13:18:16 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
´´´
`;

// GET /token/{tokenId}
// Retrieve an existing token. Since secret is traveling in path, it can be (and
// it will) logged in access logs, http proxies etc. which is a SECURITY RISK.
// Required data: tokenId (url param)
// Optional data: none
function retrieveToken(data, callback) {
  const tokenId = data.parameters.tokenId;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(tokenId);
  if (!validId) {
    return callback(400, {error: `Invalid tokenId '${tokenId}'`});
  }

  datalib.read('tokens', tokenId, function(err, token) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(404, {error:`Token id '${tokenId}' not found`});
      }
      return callback(500, ErrorPersistenceRead);
    }
    callback(200, token);
  });
}
retrieveToken.documentation = `
Get an existing token. Users can only see owned tokens.

Required fields:
* ´tokenId´ (url parameter)

Optional fields: none

Example:

´´´
curl -i http://localhost:3000/tokens/rtspz7b91zzt2ff8uuw0
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 13:21:42 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
´´´
`;

// DELETE /tokens/{tokenId}
// Delete token by id.
// Required data: tokenId (url param)
// Optional data: none
function deleteToken(data, callback) {

  const tokenId = data.parameters.tokenId;

  // Validate id:
  const validId = /^[a-z0-9]{20}$/.test(tokenId);
  if (!validId) {
    return callback(400, {error: `Invalid tokenId '${tokenId}'`});
  }

  // Retrieve token
  datalib.read('tokens', tokenId, function(err, token) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(404, {error:`Token id '${tokenId}' not found`});
      }
      console.log(err);
      return callback(500, ErrorPersistenceRead);
    }
    // Delete token
    datalib.delete('tokens', tokenId, function(err) {
      if (err) {
        console.log(err);
        return callback(500, ErrorPersistenceWrite);
      }
      callback(200, token);
    });
  });
}
deleteToken.documentation = `
Delete an existing token. Users can only delete owned tokens.

Required fields:
* ´tokenId´ (url parameter)

Optional fields: none

Example:

´´´
curl -i -X DELETE http://localhost:3000/tokens/rtspz7b91zzt2ff8uuw0
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 17:18:00 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
´´´
`;

module.exports = {
  // Users
  listUsers,
  createUser,
  retrieveUser,
  updateUser,
  deleteUser,
  // Tokens
  createToken,
  retrieveToken,
  deleteToken,
};
