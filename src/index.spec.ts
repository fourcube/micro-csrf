import micro from "micro";
import { csrfMiddleware } from ".";
import listen from "test-listen";
import request from "request-promise";
import { StatusCodeError } from "request-promise/errors";

async function setup(session = {}) {
  const withCsrf = csrfMiddleware();

  const service = micro(async (req, res) => {
    await withCsrf(session, req, res);

    return {};
  });

  const url = await listen(service);

  return { url, service };
}

describe("csrfMiddleware()", () => {
  it("should skip GET requests", async () => {
    const { url, service } = await setup();

    try {
      await expect(
        request({
          uri: url,
          method: "GET",
          json: true
        })
      ).resolves.not.toThrow();
    } finally {
      service.close();
    }
  });
  it("should skip OPTIONS requests", async () => {
    const { url, service } = await setup();

    try {
      await expect(
        request({
          uri: url,
          method: "OPTIONS",
          json: true
        })
      ).resolves.not.toThrow();
    } finally {
      service.close();
    }
  });
  it("should skip HEAD requests", async () => {
    const { url, service } = await setup();

    try {
      await expect(
        request({
          uri: url,
          method: "HEAD",
          json: true
        })
      ).resolves.not.toThrow();
    } finally {
      service.close();
    }
  });

  it("should check POST requests", async () => {
    const { url, service } = await setup();

    try {
      await expect(
        request({
          uri: url,
          method: "POST",
          json: true
        })
      ).rejects.toThrow(StatusCodeError);
    } finally {
      service.close();
    }
  });
  it("should accept POST requests with a valid token", async () => {
    const session = {} as any;
    const { url, service } = await setup(session);

    // perform a GET to get a token
    const res = await request({
      uri: url,
      method: "GET",
      json: true,
      resolveWithFullResponse: true
    });

    const csrfToken = res.headers["x-csrf-token"];

    expect(csrfToken).toBeDefined();
    expect(session.csrfSecret).toBeDefined();

    try {
      await expect(
        request({
          uri: url,
          method: "POST",
          json: true,
          headers: {
            "x-csrf-token": csrfToken
          }
        })
      ).resolves.not.toThrow();
    } finally {
      service.close();
    }
  });

  it("should reject POST requests with an invalid token", async () => {
    const session = { csrfSecret: "" } as any;
    const { url, service } = await setup(session);

    try {
      await expect(
        request({
          uri: url,
          method: "POST",
          json: true,
          headers: {
            "x-csrf-token": "invalid"
          }
        })
      ).rejects.toThrow(StatusCodeError);
    } finally {
      service.close();
    }
  });
});
