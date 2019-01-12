/*
 * Testing library is a micro test runner for this project.
 * Typical usage:
 *
 * s = new Suite();
 *
 * s.add(function MyTest(test) {
 *   test.deepEqual('a', 'a');
 * });
 *
 * s.run();
 *
 */


// Dependencies
const assert = require('assert');

// Test object constructor
function Test() {
  this.asserts = 0;
  this.errors = [];
}

Test.prototype.deepEqual = function(actual, expected, message) {
  this.asserts++;
  try {
    assert.deepEqual(actual, expected, message);
  } catch (e) {
    this.errors.push(e);
  }
};

// Suite object
function Suite() {
  this.tests = [];
};

// Add one test to run
Suite.prototype.add = function(test) {
  this.tests.push(test);
};

// Run one test
Suite.prototype.runOne = function(f) {

  var t = new Test();
  if (!f) {
    return t;
  }

  f(t);

  if (t.errors.length) {
    console.error('\x1b[31m%s\x1b[0m', `${f.name}...\tERROR`);
    t.errors.forEach(e => {
      console.error('  \x1b[31m%s\x1b[0m', e);
    })
  } else {
    console.log('\x1b[32m%s\x1b[0m', `${f.name}...\tOK`);
  }

  return t;
};

// Run all tests
Suite.prototype.run = function() {
  var errors = 0;
  var asserts = 0;
  this.tests.forEach(test => {
    var t = this.runOne(test);
    asserts += t.asserts;
    if (t.errors.length) {
      errors++;
    }
  });
  if (errors) {
    console.error('\x1b[31m%s\x1b[0m', `ERRORS ${errors} (out of ${this.tests.length})`);
  } else {
    console.log('\x1b[32m%s\x1b[0m', `PASSING! (${this.tests.length} tests, ${asserts} asserts)`);
  }
};

// Export library
module.exports = {
  Suite,
  Test,
};
