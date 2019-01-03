/*
 * Some helpers
 */

// Dependencies
const crypto = require('crypto');
const config = require('../config');

 // Validation helper
function validate(definition, data) {
  const types = {string: true, boolean: true};

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
   if (typeof(data[k]) !== definition[k].type) {
     return `Field '${k}' should be ${definition[k].type}`;
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

module.exports = {
  validate,
  hash,
  parseJsonObject,
};
