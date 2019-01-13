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
function Test(callback) {
  this.asserts = 0;
  this.errors = [];
  this.callback = callback;
}

Test.prototype.deepEqual = function(actual, expected, message) {
  this.asserts++;
  try {
    assert.deepEqual(actual, expected, message);
  } catch (e) {
    this.errors.push(e);
  }
};

Test.prototype.done = function() {
  this.callback();
};

// Suite object
function Suite() {
  this.tests = [];
};

// Add one test to run
Suite.prototype.add = function(test) {
  this.tests.push(test);
};

// Add one test to run asynchronously
Suite.prototype.addAsync = function(test) {
  test.async = true;
  this.tests.push(test);
};

// Run one test
Suite.prototype.runOne = function(f) {
  return new Promise(function(resolve, reject) {
    var finish = function() {
      if (t.errors.length) {
        console.error('\x1b[31m%s\x1b[0m', `${f.name}...\tERROR`);
        t.errors.forEach(e => {
          console.error('  \x1b[31m%s\x1b[0m', e);
        })
      } else {
        console.log('\x1b[32m%s\x1b[0m', `${f.name}...\tOK`);
      }
      resolve(t);
    };

    var t = new Test(finish);
    if (!f) {
      return t;
    }

    f(t);

    if (!f.async) {
      finish();
    }
  });
};

// Run all tests
Suite.prototype.run = function() {
  var suite = this;
  var list = this.tests.map(test => suite.runOne(test));

  return Promise.all(list).then(function(results) {
    var errors = 0;
    var asserts = 0;

    results.forEach(test => {
      asserts += test.asserts;
      if (test.errors.length) {
        errors++;
      }
    });

    if (errors) {
      console.error('\x1b[31m%s\x1b[0m', `ERRORS ${errors} (out of ${results.length} tests)`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', `PASSING! (${results.length} tests, ${asserts} asserts)`);
    }
  });
};

// Export library
module.exports = {
  Suite,
  Test,
};
