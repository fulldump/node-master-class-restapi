# Homework Assignment #1

This branch is created from `building-a-restful-api` branch in order to take advantage of lesson learning.

# Some differences

## URL path normalization

Path `/my/path/` is not being normalized to `my/path` because I prefer two different URL never have the same content in order to optimize SEO.

As a future enhacement, paths ending with slash should be redirected to the canonical path with a `300` or `301` and `Location` Header.

## Empty responses

If a handler is not returning data it is not fallbacked to empty object, it will return a `204 No content` with an empty body (`application/json` content type is not sent in that case).

Example:

```http
HTTP/1.1 204 No Content
Date: Wed, 02 Jan 2019 12:25:46 GMT
Connection: keep-alive

```

instead of:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Date: Wed, 02 Jan 2019 12:26:58 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{}
```

## Response payload format

In order to make the API more human friendly, all responses are formatted and indented so that command line users can have this:

```json
{
    "name": "Fulanez",
    "age": 33
}
```

instead of this:

```json
{"name": "Fulanez", "age": 33}
```

## Access log

All logged requests are enriched with current time in UTC.

## Recent ECMA

In some cases I have been using some latest ECMA Script features just for better readability.

# How to run

In the repo directory, execute the command:

```bash
node index.js
```

Changing from environment (`staging` and `production` are available) just use the environment variable `E`. Example:

```bash
E=production node index.js
```
