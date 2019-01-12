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
node lib/rouer.tests.js
```

If you want to run all tests:

```bash
node tests.js
```

# Some differences

##

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```
