# micro-csrf

`micro-csrf` is a csrf middleware for Zeit.co's [micro](https://github.com/zeit/micro) framework. This module is heavily inspired by [`express-csurf`](https://github.com/expressjs/csurf).

## Installation

```bash
$ npm install micro-csrf
# or
$ yarn add micro-csrf
```

## Example Usage

```javascript

// Use the micro-session middleware for storing the token secret
const SessionManager, { MemoryStore } = require('micro-session');
const { csrfMiddleware } = require('micro-csrf');

const sessionManager = SessionManager({
  store: new MemoryStore(),
  secret: 'my session secret'
})
const csrf = csrfMiddleware();

module.exports = async (req, res) => {
  let session = await getSession(req, res);

  // This will automatically end the request with a 403 error
  // if this is a POST, PUT, PATCH, DELETE request without a valid
  // CSRF Token.
  const csrfToken = await csrf(session, req, res);

  // ...

  return {
    csrfToken
  };
};
```

## Token Validation

The token is automatically read from the following locations:

```
    req.body._csrf - requires a parsed request body
    req.query._csrf - requires a query parser
    req.headers['csrf-token'] - the CSRF-Token HTTP request header.
    req.headers['xsrf-token'] - the XSRF-Token HTTP request header.
    req.headers['x-csrf-token'] - the X-CSRF-Token HTTP request header.
    req.headers['x-xsrf-token'] - the X-XSRF-Token HTTP request header.
```

## License

[MIT](LICENSE)
