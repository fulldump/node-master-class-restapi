# Homework Assignment #2

This branch is created from [building-a-restful-api](https://github.com/fulldump/pirple-node-master-class/tree/building-a-restful-api) branch in order to take advantage of lesson learning.

# Some differences

##

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

# How to run

In the repo directory, execute the command:

```bash
node index.js
```

Changing from environment (`staging` and `production` are available) just use the environment variable `E`. Example:

```bash
E=production node index.js
```
