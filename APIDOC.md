
# API Doc Reference

* [ListUsers](#listusers---get-users)
* [CreateUser](#createuser---post-users)
* [RetrieveUser](#retrieveuser---get-usersuseremail)
* [UpdateUser](#updateuser---patch-usersuseremail)
* [DeleteUser](#deleteuser---delete-usersuseremail)


## ListUsers - GET /users


List all users. You should be administrator.

Example:
```
curl -i http://localhost:3000/users
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 21:03:47 GMT
Connection: keep-alive
Transfer-Encoding: chunked

[
    "fulanez@email.com",
    "menganez@email.com",
    "zutanez@email.com"
]
```


## CreateUser - POST /users


Create a new user.
Required fields: email, name, address
Optional fields: age, phone


## RetrieveUser - GET /users/{userEmail}


Retrieve a user by email.

Example:
```
curl -i  http://localhost:3000/users/fulanez@email.com
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:29:49 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanez@email.com",
    "name": "Fulanez",
    "address": "Elm street 75",
    "createTimestamp": 1547325441677
}
```


## UpdateUser - PATCH /users/{userEmail}


Update a user by email with path `/users/{userEmail}`.

Allowed fields to update:
* `name`
* `address`

Example:
```
curl -i -X PATCH http://localhost:3000/users/fulanez@email.com -d '{"address": "Elm street 3"}'
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:44:07 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanez@email.com",
    "name": "Fulanez",
    "address": "Elm street 3",
    "createTimestamp": 1547325441677,
    "updateTimestamp": 1547333047445
}
```


## DeleteUser - DELETE /users/{userEmail}


Delete a user by email.

Notice the user is returned back, just in case of error that information
could be inserted again.

Example:
```
curl -i -X DELETE http://localhost:3000/users/zutanez@email.com
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 12 Jan 2019 22:55:53 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "zutanez@email.com",
    "name": "Zutanez",
    "address": "Elm street 75",
    "createTimestamp": 1547325503128
}
```




---
Generated on Sun Jan 13 2019 01:21:42 GMT+0100 (CET)

