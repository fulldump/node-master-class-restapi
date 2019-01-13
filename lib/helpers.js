/*
 * Some helpers
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

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

// Send an SMS messag via Twilio
function sendTwilioSms(phone, msg, callback) {
  // Validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length >= 9 ? phone.trim() : false;
  msg = typeof(msg) == 'string' & msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (!phone || !msg) {
    return callback('Given parameters are missing or invalid');
  }

  // Configure the request payload
  const payload = {
    From: config.twilio.fromPhone,
    To: phone,
    Body: msg,
  };

  // Stringify the payload
  const stringPayload = querystring.stringify(payload);

  // Request details
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.twilio.com',
    method: 'POST',
    path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload),
    },
  };

  // Instantiate the request object
  const req = https.request(requestDetails, function(res) {
    // Grab the status of the sent request
    const status = res.statusCode;
    // Callback
    if (status === 200 || status === 201) {
      return callback();
    }
    callback('Status code returned was '+status);
  });

  // Bind to the error event so it does not get thrown
  req.on('error', callback);

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
}

// Put first letter of a string uppercase
function capitalize(s) {
  if (s.len === 0) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Generate anchor from a title to be linked from the TOC
function anchorize(s) {
  s = s.toLowerCase();
  s = s.replace(/[\ ]/g, '-');
  s = s.replace(/[^a-z0-9\-]/g, '');
  return s;
}

// Generate API Documentation in Markdown format
function genApiDoc(router) {

  // Initialize Table Of Contents
  var toc = '';

  var doc = '';
  for(var path in router.paths) {
    const resource = router.paths[path];

    for (var method in resource.methods) {
      var handler = resource.methods[method];
      if (!handler) {
        // Handler is not defined
        continue;
      }

      const title = `${capitalize(handler.name)} - ${method.toUpperCase()} ${path}`;

      toc += `* [${capitalize(handler.name)}](${anchorize(title)})\n`;

      // Section handler.
      doc += `## ${title}\n\n`;
      doc += handler.documentation.replace(/´/g, '`') + '\n\n';
    }
  }

  return `
# API Doc Reference

${toc}

${doc}

---
Generated on ${new Date()}
`;
};

module.exports = {
  validate,
  hash,
  parseJsonObject,
  createRandomString,
  sendTwilioSms,
  genApiDoc,
};
