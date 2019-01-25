
# API Doc Reference

* [ListUsers (authorized)](#listusers-authorized---get-users)
* [CreateUser](#createuser---post-users)
* [RetrieveUser](#retrieveuser---get-usersuseremail)
* [UpdateUser](#updateuser---patch-usersuseremail)
* [DeleteUser](#deleteuser---delete-usersuseremail)
* [CreateToken](#createtoken---post-tokens)
* [RetrieveToken](#retrievetoken---get-tokenstokenid)
* [DeleteToken](#deletetoken---delete-tokenstokenid)
* [ListMenu (authorized)](#listmenu-authorized---get-menu)
* [ListCart (authorized)](#listcart-authorized---get-cart)
* [AddToCart (authorized)](#addtocart-authorized---post-cart)


## ListUsers (authorized) - GET /users

Note: This operation requires user authentication via header `Token`.


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

Required fields:
* `email`
* `name`
* `address`

Optional fields:
* `age`
* `phone`

Example:

```
curl -i http://localhost:3000/users -d '{"email":"fulanito@email.com", "name":"Fulanez", "address":"Elm street 33"}'
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 00:25:56 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "email": "fulanito@email.com",
    "name": "Fulanez",
    "address": "Elm street 33",
    "createTimestamp": 1547339156046
}
```


## RetrieveUser - GET /users/{userEmail}


Retrieve a user by email.

Required fields:
* `email`

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


Update a user by email.

Required fields:
* `email` (string)

Optional fields:
* `name` (string)
* `address` (string)
* `age` (number)
* `phone` (string)

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


## CreateToken - POST /tokens


Login a user into the system creating a token valid for a short period of life
(1h by default).

Required fields:
* `tokenId` (url parameter)

Optional fields: none

Example:

```
curl -i http://localhost:3000/tokens -d '{"email":"59m58tgj06@email.com", "password":"123456"}'
HTTP/1.1 201 Created
Content-Type: application/json
Date: Sun, 13 Jan 2019 13:18:16 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
```


## RetrieveToken - GET /tokens/{tokenId}


Get an existing token. Users can only see owned tokens.

Required fields:
* `tokenId` (url parameter)

Optional fields: none

Example:

```
curl -i http://localhost:3000/tokens/rtspz7b91zzt2ff8uuw0
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 13:21:42 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
```


## DeleteToken - DELETE /tokens/{tokenId}


Logout by deleting an existing token. Users can only delete owned tokens.

Required fields:
* `tokenId` (url parameter)

Optional fields: none

Example:

```
curl -i -X DELETE http://localhost:3000/tokens/rtspz7b91zzt2ff8uuw0
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 17:18:00 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
    "id": "rtspz7b91zzt2ff8uuw0",
    "email": "59m58tgj06@email.com",
    "expires": 1547389096153
}
```


## ListMenu (authorized) - GET /menu

Note: This operation requires user authentication via header `Token`.


List all menu items. User should be logged in.

Required fields: none

Optional fields: none

Example:

```
curl -i http://localhost:3000/menu -H 'Token: qkwjc1zwujgy0hrvvata'
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 13 Jan 2019 22:19:44 GMT
Connection: keep-alive
Transfer-Encoding: chunked

[
    {
        "name": "Pepperoni",
        "description": "Classical Italian pepperonini pizzinni.",
        "picture": "/img/pepperoni.png",
        "price": 22.5
    },
    {
        "name": "Cheese",
        "description": "Five layers of Italian creamy cheese.",
        "picture": "/img/cheese.png",
        "price": 21.5
    }
]
```


## ListCart (authorized) - GET /cart

Note: This operation requires user authentication via header `Token`.


List all cart items. User should be logged in.

Required fields: none

Optional fields: none

Example:




## AddToCart (authorized) - POST /cart

Note: This operation requires user authentication via header `Token`.


Add one or more products to user's cart. User should be logged in.

Required fields: none

Optional fields: none

Example:






---
Generated on Sat Jan 26 2019 00:16:48 GMT+0100 (CET)

