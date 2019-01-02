# Building a RESTful API

This branch is following chapter _Building a RESTful API_ from the course.

## Creating TLS certificate

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```
