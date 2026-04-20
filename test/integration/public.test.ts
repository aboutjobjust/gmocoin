import assert from "node:assert/strict";
import test from "node:test";

import { GmoCoinClient } from "../../src/index.ts";

const symbol = process.env.GMO_TEST_PUBLIC_SYMBOL ?? "BTC";
const currentYear = String(new Date().getUTCFullYear());

test("public live smoke: status", async () => {
  const client = new GmoCoinClient();
  const response = await client.getStatus();

  assert.equal(response.status, 0);
  assert.match(response.data.status, /^(MAINTENANCE|PREOPEN|OPEN)$/);
});

test("public live smoke: ticker", async () => {
  const client = new GmoCoinClient();
  const response = await client.getTicker({ symbol });

  assert.equal(response.status, 0);
  assert.ok(Array.isArray(response.data));
  assert.ok(response.data.length >= 1);
  assert.equal(response.data[0]?.symbol, symbol);
});

test("public live smoke: symbols", async () => {
  const client = new GmoCoinClient();
  const response = await client.getSymbols();

  assert.equal(response.status, 0);
  assert.ok(Array.isArray(response.data));
  assert.ok(response.data.length >= 1);
});

test("public live smoke: orderbooks", async () => {
  const client = new GmoCoinClient();
  const response = await client.getOrderbooks({ symbol });

  assert.equal(response.status, 0);
  assert.equal(response.data.symbol, symbol);
  assert.ok(Array.isArray(response.data.asks));
  assert.ok(Array.isArray(response.data.bids));
});

test("public live smoke: trades", async () => {
  const client = new GmoCoinClient();
  const response = await client.getTrades({ symbol, count: 5, page: 1 });

  assert.equal(response.status, 0);
  assert.ok(Array.isArray(response.data.list));
  assert.ok(response.data.list.length >= 1);
});

test("public live smoke: klines", async () => {
  const client = new GmoCoinClient();
  const response = await client.getKlines({ symbol, interval: "1day", date: currentYear });

  assert.equal(response.status, 0);
  assert.ok(Array.isArray(response.data));
  assert.ok(response.data.length >= 1);
});
