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
};

// Production
environments.production = {
  httpPort: 80,

  httpsPort: 443,
  httpsKey: './https/key.pem',
  httpsCert: './https/cert.pem',

  envName: 'production',
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = process.env.E || 'staging';

// Check that the current environment exists
var environmentToExport = environments[currentEnvironment] || environments.staging;

// Export the module
module.exports = environmentToExport;
