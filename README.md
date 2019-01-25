# Homework Assignment #2

This branch is created from [building-a-restful-api](https://github.com/fulldump/pirple-node-master-class/tree/building-a-restful-api) branch in order to take advantage of lesson learning.

You can find this API documentation in [APIDOC.md](./APIDOC.md).

# How to run

In the repo directory, execute the command:

```bash
node index.js
```

Changing from environment (`staging` and `production` are available) just use the environment variable `E`. Example:

```bash
E=production node index.js
```

# How to regenerate documentation

This project can generate documentation of all endpoints exposed by the server. If you change the API documentation can be regenerated with following command:

```bash
APIDOC=yes node index.js > APIDOC.md
```

# How to run tests

Testing library is a small test runner tool just for this course. If a source
file has tests (for example `lib/router.js`) you can run its tests with the
following command:

```bash
node lib/router.tests.js
```

If you want to run all tests:

```bash
node tests.js
```

During development process maybe you want run only one test (or a small subset).
You can do it with a regex:

```bash
TESTREGEX=ShoppingCart node tests.js
```

# How to check specs

You can check which project requirements have been accomplished by executing
the following command:

```bash
node specs.js
```

# Some differences

## Promises

Sometimes modules or functions are taking advantage of promises to improve
code readability and/or simplify logic by promises combinations.

A clear example is returning a promise that waits for all servers (HTTP and
HTTPS) to stop.

## ES6

Some Ecma Script 6 features has been extensively used to improve code
readability:

* Constants
* String interpolation
* Arrow functions
* Property shorthand
* Promises

## Testing

In order to develop in a TDD way, I had to write a small testing library
(that is also tested). At the beginning only synchronous tests was allowed
but later I had to introduce asynchronous tests in order to run the HTTP
server and execute tests in the same process.

## Decoupled modules

Most modules was highly coupled (server, router, data). That coupling makes
it hard to test and reuse without modifying some things for each particular
case.

The current project status has `server` and `router` have been partially
decoupled and tested. I plan the same with `configuration` and `data`.

## Router

Router has been improved to accept also methods and path parameters.

Typical use case:

```js
var r = new router.Router();
r.path('/users/{userId}/history')
  .method('GET', function listUserHistory(req, callback) {
    // Retrieve history for user req.parameters.userId
  })
  .method('POST', function createUserHistory(req, callback) {
    // Create history entry for user req.parameters.userId
  });
```

## The `makeRequest` helper

Making HTTP/HTTPS requests sending and receiving JSON information is so widely
used for testing and communicating to other services that the existence of
this helper is more than justified.

The function signature receive four parameters (two of them optional):

* `method` - The HTTP method
* `uri` - The full URI (with schema and everything, ie:
  `http://example.com/hi?name=John`)
* `headers` - [OPTIONAL] Map with headers to be sent
* `body` - [OPTIONAL] Payload to be sent. If string it will be sent as it is,
  otherwise it will be serialized to JSON.

A promise is returned back with the default response object plus an extra
attribute `payload` with all response body content that will be JSON parsed
when possible.

## The authentication middleware

Some handlers must be authenticated in order to reduce code, errors and improve
maintainability. The handler `handlers.authorized` acts as a
middleware/interceptor of other handlers. It receive a handler as input and
return other handler that will only be executed if a user is authenticated (in
this case via token header). Also the authenticated user is injected into the
handler into `req` parameter.

Example:

```js
const MyProtectedHandler = authorized(function(req, callback) {

  // This handler will only be executed if a valid user is logged in
  callback(200, {message: `Welcome ${req.user.name}` });

});
```

This is clear if handlers are wrapped in the router, where you can see in a
glance, which handlers are authenticated:

```js
var myRouter = new router.Router();

myRouter.path('/users')
  .method('GET', authorized(handlers.listUsers)) // Authenticated endpoint!
  .method('POST', handlers.createUser);

myRouter.path('/menu')
  .method('GET', authorized(handlers.listMenu)); // Authenticated endpoint!
```
