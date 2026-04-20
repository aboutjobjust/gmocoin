import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { GmoCoinApiError, GmoCoinClient } from "../../src/index.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function sign(secret: string, text: string): string {
  return createHmac("sha256", secret).update(text).digest("hex");
}

test("public request builds query parameters without auth headers", async () => {
  let requestUrl = "";
  let requestHeaders = new Headers();

  const client = new GmoCoinClient({
    fetch: async (input, init) => {
      requestUrl = String(input);
      requestHeaders = new Headers(init?.headers);
      return jsonResponse({ status: 0, data: [], responsetime: "2026-04-20T00:00:00.000Z" });
    }
  });

  await client.getTicker({ symbol: "BTC" });

  assert.equal(requestUrl, "https://api.coin.z.com/public/v1/ticker?symbol=BTC");
  assert.equal(requestHeaders.get("API-KEY"), null);
  assert.equal(requestHeaders.get("API-SIGN"), null);
});

test("private GET signs timestamp, method, and path without query string", async () => {
  const timestamp = 1700000000000;
  let requestUrl = "";
  let requestHeaders = new Headers();

  const client = new GmoCoinClient({
    apiKey: "test-key",
    secretKey: "test-secret",
    now: () => timestamp,
    fetch: async (input, init) => {
      requestUrl = String(input);
      requestHeaders = new Headers(init?.headers);
      return jsonResponse({ status: 0, data: { list: [] }, responsetime: "2026-04-20T00:00:00.000Z" });
    }
  });

  await client.getOrders({ orderId: [123, 456] });

  assert.equal(requestUrl, "https://api.coin.z.com/private/v1/orders?orderId=123%2C456");
  assert.equal(requestHeaders.get("API-KEY"), "test-key");
  assert.equal(requestHeaders.get("API-TIMESTAMP"), String(timestamp));
  assert.equal(requestHeaders.get("API-SIGN"), sign("test-secret", `${timestamp}GET/v1/orders`));
});

test("private POST signs the serialized JSON body", async () => {
  const timestamp = 1700000000001;
  let requestHeaders = new Headers();
  let requestBody = "";

  const payload = {
    symbol: "BTC_JPY",
    side: "BUY" as const,
    executionType: "LIMIT" as const,
    timeInForce: "FAS" as const,
    price: "430001",
    size: "0.02"
  };

  const client = new GmoCoinClient({
    apiKey: "test-key",
    secretKey: "test-secret",
    now: () => timestamp,
    fetch: async (_input, init) => {
      requestHeaders = new Headers(init?.headers);
      requestBody = String(init?.body ?? "");
      return jsonResponse({ status: 0, data: "1", responsetime: "2026-04-20T00:00:00.000Z" });
    }
  });

  await client.createOrder(payload);

  const expectedBody = JSON.stringify(payload);
  assert.equal(requestBody, expectedBody);
  assert.equal(requestHeaders.get("content-type"), "application/json");
  assert.equal(
    requestHeaders.get("API-SIGN"),
    sign("test-secret", `${timestamp}POST/v1/order${expectedBody}`)
  );
});

test("ws-auth PUT omits the request body from the signature", async () => {
  const timestamp = 1700000000002;
  let requestHeaders = new Headers();
  let requestBody = "";

  const client = new GmoCoinClient({
    apiKey: "test-key",
    secretKey: "test-secret",
    now: () => timestamp,
    fetch: async (_input, init) => {
      requestHeaders = new Headers(init?.headers);
      requestBody = String(init?.body ?? "");
      return jsonResponse({ status: 0, data: undefined, responsetime: "2026-04-20T00:00:00.000Z" });
    }
  });

  await client.extendWebSocketToken({ token: "abc" });

  assert.equal(requestBody, JSON.stringify({ token: "abc" }));
  assert.equal(requestHeaders.get("API-SIGN"), sign("test-secret", `${timestamp}PUT/v1/ws-auth`));
});

test("private requests require credentials", async () => {
  const client = new GmoCoinClient({
    fetch: async () => jsonResponse({ status: 0, data: {}, responsetime: "2026-04-20T00:00:00.000Z" })
  });

  await assert.rejects(() => client.getMargin(), /requires both `apiKey` and `secretKey`/);
});

test("non-zero API status throws GmoCoinApiError with message details", async () => {
  const client = new GmoCoinClient({
    fetch: async () =>
      jsonResponse({
        status: 5,
        messages: [{ message_code: "ERR-001", message_string: "bad request" }],
        responsetime: "2026-04-20T00:00:00.000Z"
      })
  });

  await assert.rejects(
    () => client.getStatus(),
    (error: unknown) => {
      assert.ok(error instanceof GmoCoinApiError);
      const apiError = error;
      assert.match(apiError.message, /ERR-001: bad request/);
      return true;
    }
  );
});

test("http errors throw GmoCoinApiError", async () => {
  const client = new GmoCoinClient({
    fetch: async () =>
      jsonResponse(
        {
          messages: [{ message_code: "ERR-500", message_string: "server error" }]
        },
        500
      )
  });

  await assert.rejects(
    () => client.getStatus(),
    (error: unknown) => {
      assert.ok(error instanceof GmoCoinApiError);
      const apiError = error;
      assert.equal(apiError.httpStatus, 500);
      assert.match(apiError.message, /ERR-500: server error/);
      return true;
    }
  );
});
