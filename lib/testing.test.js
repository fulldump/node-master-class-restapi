
// Dependencies
const testing = require('./testing');

// Initialize suite
var suite = new testing.Suite();

// Add test cases

suite.addAsync(function Sleep20(t) {
  setTimeout(function() {
    console.log('A');
    t.done();
  }, 20);
});

suite.addAsync(function Sleep10(t) {
  setTimeout(function() {
    console.log('B');
    t.done();
  }, 10);
});

suite.add(function SyncTest(t) {
  console.log('C');
});

// Run test suite
suite.run();
