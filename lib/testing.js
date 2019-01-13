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

Test.prototype.ok = function(value, message) {
  this.asserts++;
  assert.ok(value, message);
};

Test.prototype.fail = function(message) {
  this.asserts++;
  assert.fail(message);
  this.errors.push(message);
};

Test.prototype.ok = function(value, message) {
  this.asserts++;
  assert.ok(value, message);
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

  // Prepare regex to filter tests we want to run with environment variable `TESTREGEX`
  var testregex = process.env.TESTREGEX;
  if (testregex) {
    testregex = new RegExp(testregex, 'i');
  }

  // Filter and execute tests
  var list = this.tests
    // Filter tests to run
    .filter(test => !testregex || testregex.test(test.name))
    // Run filtered tests
    .map(test => suite.runOne(test));

  // When all tests are finished, gather some stats and print a final message.
  // Promise is returned back just in case someone want to perform some actions
  // after all test suite has been executed (cleaning, free resources, etc.)
  return Promise.all(list).then(function(results) {
    var errors = 0;
    var asserts = 0;

    // Traverse all test results
    results.forEach(test => {
      asserts += test.asserts;
      if (test.errors.length) {
        errors++;
      }
    });

    // Skip printing results if the suite is empty
    if (!results.length) {
      return;
    }

    // Print results stats
    if (errors) {
      // Some tests failed (red)
      console.error('\x1b[31m%s\x1b[0m', `ERRORS ${errors} (out of ${results.length} tests)`);
    } else {
      // All tests passed (green)
      console.log('\x1b[32m%s\x1b[0m', `PASSING! (${results.length} tests, ${asserts} asserts)`);
    }

  });
};

// Export library
module.exports = {
  Suite,
  Test,
};
