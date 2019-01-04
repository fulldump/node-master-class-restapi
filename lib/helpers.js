/*
 * Some helpers
 */

// Dependencies
const crypto = require('crypto');
const config = require('../config');

 // Validation helper
function validate(definition, data) {
  const types = {
    string: true,
    boolean: true,
    object: true,
    array: true,
    number: true,
  };

  // Change definition from '<type>,<required>' to {type: <type>, required: true}
  for (var k in definition) {
   var s = definition[k].split(',');
   var t = {};
   s.forEach(w => {
     if (w in types) {
       t.type = w;
       return;
     }
     if ('required' === w) {
       t.required = true;
       return;
     }
   })
   definition[k] = t;
  }

  // Validate data
  for (var k in data) {
   if (!(k in definition)) {
     return `Field '${k}' is not allowed`;
   }
   var fieldType = typeof(data[k]);
   if (fieldType !== definition[k].type) {
     return `Field '${k}' should be ${definition[k].type} instead of ${fieldType}`;
   }
   definition[k].required = false;
  }

  // Check remaining required fields
  var required = [];
  for (var k in definition) {
   if (definition[k].required) {
     required.push(k);
   }
  }

  if (required.length) {
   return `Fields [${required.join(', ')}] are mandatory`;
  }

  return;
}

// Create a SHA256 hash
function hash(s) {
  const secret = config.hashingSecret;
  return crypto.createHmac('sha256', secret).update(s).digest('hex');
};

// Parse a JSON string to an object catching exception
function parseJsonObject(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return {};
  }
}

// Crate a string of random alphanumeric characters of a given length
const createRandomString = (function() {
  // Closure to maintain these variables hidden from any scope
  const possibleChars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  const possibleCharsLength = possibleChars.length;

  return function(len) {
    var s = '';
    for (var i=0; i<len; i++) {
      s += possibleChars.charAt(Math.floor(Math.random()*possibleCharsLength))
    }
    return s;
  }
})();

module.exports = {
  validate,
  hash,
  parseJsonObject,
  createRandomString,
};
