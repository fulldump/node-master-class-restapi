/*
 * Create and export configuration variables
*/

// Container for all the environments
var environments = {};

// Staging (default)
environments.staging = {
  port: 3000,
  envName: 'staging',
};

// Production
environments.production = {
  port: 5000,
  envName: 'production',
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = process.env.E || 'staging';

// Check that the current environment exists
var environmentToExport = environments[currentEnvironment] || environments.staging;

// Export the module
module.exports = environmentToExport;
