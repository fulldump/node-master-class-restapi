/*
 * Create and export configuration variables
*/

// Container for all the environments
var environments = {};

// Staging (default)
environments.staging = {
  httpPort: 3000,

  httpsPort: 3001,
  httpsKey: './https/key.pem',
  httpsCert: './https/cert.pem',

  envName: 'staging',

  hashingSecret: '4e813ba4-0ef2-11e9-b82a-3f52039d5202',

  maxChecks: 5,

  twilio: {
    fromPhone: '',
    accountSid: '',
    authToken: '',
  },

};

// Production
environments.production = {
  httpPort: 80,

  httpsPort: 443,
  httpsKey: './https/key.pem',
  httpsCert: './https/cert.pem',

  envName: 'production',

  hashingSecret: '529ce9ea-0ef2-11e9-8020-9b2eaffb007a',

  maxChecks: 5,

  twilio: {
    fromPhone: '',
    accountSid: '',
    authToken: '',
  },

};

// Determine which environment was passed as a command-line argument
var currentEnvironment = process.env.E || 'staging';

// Check that the current environment exists
var environmentToExport = environments[currentEnvironment] || environments.staging;

// Export the module
module.exports = environmentToExport;
