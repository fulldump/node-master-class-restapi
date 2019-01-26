/*
 * Some helpers
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const http = require('http');
const url = require('url');
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
  return `#${s}`;
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

      const handlerName = handler.prettyName || handler.name;

      const title = `${capitalize(handlerName)} - ${method.toUpperCase()} ${path}`;

      toc += `* [${capitalize(handlerName)}](${anchorize(title)})\n`;

      // Section handler.
      doc += `## ${title}\n\n`;
      if (handler.documentation) {
        doc += handler.documentation.replace(/´/g, '`') + '\n\n';
      }
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

// Make an http request and serialize/unserialize response/request payloads properly.
// It returns a promise with standard http response plus attribute `payload`
function makeRequest(method, uri, headers, body) {

  headers = headers || {};
  body = body || '';
  if (!(typeof body == 'string')) {
    body = JSON.stringify(body);
  }

  return new Promise(function(resolve, reject) {
    const parsedUrl = url.parse(uri);

    const requestDetails = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      method,
      headers,
      path: parsedUrl.path,
      timeout: 2 * 1000, // @TODO: hardcoded value
    };


    var client = 'https:' === parsedUrl.protocol ? https : http;
    var req = client.request(requestDetails, function(res) {
      // Configure encoding
      res.setEncoding('utf8');

      // Collect body
      var payload = '';
      res.on('data', function(chunk) {
        payload += chunk;
      })
      res.on('end', function() {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          // Do nothing
        }
        res.payload = payload;
        resolve(res);
      });
    });

    // Bind to the error event so it does not ge thrown
    req.on('error', reject);

    // Bind to the timeout event
    req.on('timeout', reject);

    // End the request
    req.end(body, 'utf8');

  });
}

// stripePayment process a payment via Stripe company.
// @param {number} amount - Amount of money that will be charged
// @param {string} description - [Optional] description to correlate transaction
function stripePayment(amount, description) {

  // Define fields to be sent
  var fields = {
    amount,
    currency: 'usd',
    description: description || 'Pizzaco charge',
    source: 'tok_visa',
  };

  // Escape values
  var escaped = [];
  for (var k in fields) {
    escaped.push(k+'='+encodeURIComponent(fields[k]));
  }

  // Join all key-values into a string
  var payload = escaped.join('&');

  var url = 'https://api.stripe.com/v1/charges';

  var headers = {
    'Authorization': config.stripe.authorizationHeader,
  };

  return makeRequest('POST', url, headers, payload);
}

// buildMultipartPayload create a random boundary that will be added to headers
// and return a multipart body (string)
// @param {object} headers - headers object to be sent
// @param {object} fields - fields and values to be sent
// This function is implemented doing reverse engineering sending a curl request
// to a local socket :D, maybe it is not going to follow any RFCs.
//
// From MailGun documentation:
// curl -s --user 'api:9d62c20a6658d70fad362a5bcd560ec9-2d27312c-7848ba68' \
//     https://api.mailgun.net/v3/sandbox16f2f2e2d9ac48668e6defb8a81d0a4f.mailgun.org/messages \
//         -F from='Mailgun Sandbox <postmaster@sandbox16f2f2e2d9ac48668e6defb8a81d0a4f.mailgun.org>' \
//         -F to='Gerardo Oscar <gerardooscarjt@gmail.com>' \
//         -F subject='Hello Gerardo Oscar' \
//         -F text='Congratulations Gerardo Oscar, you just sent an email with Mailgun!  You are truly awesome!'
function buildMultipartPayload(headers, fields) {
  const boundary = '-'.repeat(24) + createRandomString(16);
  headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
  var payload = '';
  for (var k in fields) {
    payload += '--'+boundary + '\n';
    payload += `Content-Disposition: form-data; name="${k}"\n\n`;
    payload += fields[k] + '\n';
  }
  payload += '--'+boundary + '--\n\n';
  return payload;
}

// mailgunSendEmail send an email via mailgun and return a promise to get
// response from mailgun service.
function mailgunSendEmail(to, subject, text) {
  // Define fields to be sent
  var fields = {
    from: 'Mailgun Sandbox <postmaster@sandbox16f2f2e2d9ac48668e6defb8a81d0a4f.mailgun.org>',
    to: to,
    subject: subject || 'Receipt from Pizzaco',
    text: text,
  };

  var headers = {
    'User-Agent': 'curl/7.49.0',
    'Authorization': config.mailgun.authorizationHeader,
  };

  const payload = buildMultipartPayload(headers, fields);

  var url = 'https://api.mailgun.net/v3/sandbox16f2f2e2d9ac48668e6defb8a81d0a4f.mailgun.org/messages';

  return makeRequest('POST', url, headers, payload);
}

module.exports = {
  validate,
  hash,
  parseJsonObject,
  createRandomString,
  sendTwilioSms,
  genApiDoc,
  makeRequest,
  stripePayment,
  mailgunSendEmail,
};
