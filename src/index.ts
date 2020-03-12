import { IncomingMessage, ServerResponse } from "http";
import csrf from "csrf";

type SessionLike = { [key: string]: any };
type MicroError = Error & {
  statusCode: number;
};
type ParsedIncomingMessage = IncomingMessage & {
  body?: { [key: string]: any };
  query?: { [key: string]: any };
};

function csrfMiddleware(): (
  session: SessionLike,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<string> {
  const csrfManager = new csrf();

  return async (session: SessionLike, req, res) => {
    if (isIgnoredMethod(req.method)) {
      // Skip processing if this is a non-mutating HTTP request.
      // OK - issue a new token
      return await createToken(csrfManager, session, res);
    }

    if (isValidToken(csrfManager, session, req)) {
      // OK - issue a new token
      return await createToken(csrfManager, session, res);
    }

    // Error - Validation failed
    const err = new Error("invalid CSRF token") as MicroError;
    err.statusCode = 403;
    throw err;
  };
}

function isIgnoredMethod(method?: string) {
  return method && ["GET", "HEAD", "OPTIONS"].indexOf(method) > -1;
}

function fetchToken(req: ParsedIncomingMessage) {
  return (
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf) ||
    req.headers["csrf-token"] ||
    req.headers["xsrf-token"] ||
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"]
  );
}

async function createToken(
  csrfManager: csrf,
  session: SessionLike,
  res: ServerResponse
) {
  session.csrfSecret = await csrfManager.secret();
  const csrfToken = csrfManager.create(session.csrfSecret);
  res.setHeader("X-CSRF-TOKEN", csrfToken);

  return csrfToken;
}

function isValidToken(
  csrfManager: csrf,
  session: SessionLike,
  req: IncomingMessage
) {
  const token = fetchToken(req);
  const secret = session.csrfSecret;
  return csrfManager.verify(secret, token);
}

export { csrfMiddleware };
