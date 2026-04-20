import { GmoCoinClient, isMarketSymbol } from "../../src/index.ts";
import assert from "../helpers/assert.ts";
import { readTestConfig } from "../helpers/config.ts";
import { test } from "../helpers/harness.ts";

const configuredSymbol = readTestConfig("GMO_TEST_PUBLIC_SYMBOL", "BTC") ?? "BTC";
if (!isMarketSymbol(configuredSymbol)) {
  throw new Error(`GMO_TEST_PUBLIC_SYMBOL must be one of MARKET_SYMBOLS. Received: ${configuredSymbol}`);
}
const symbol = configuredSymbol;
const currentYear = String(new Date().getUTCFullYear());

test("public live smoke: status", async () => {
  const client = new GmoCoinClient();
  const response = await client.getStatus();

  assert.match(response.status, /^(MAINTENANCE|PREOPEN|OPEN)$/);
});

test("public live smoke: ticker", async () => {
  const client = new GmoCoinClient();
  const response = await client.getTicker({ symbol });

  assert.ok(Array.isArray(response));
  assert.ok(response.length >= 1);
  assert.equal(response[0]?.symbol, symbol);
});

test("public live smoke: symbols", async () => {
  const client = new GmoCoinClient();
  const response = await client.getSymbols();

  assert.ok(Array.isArray(response));
  assert.ok(response.length >= 1);
});

test("public live smoke: orderbooks", async () => {
  const client = new GmoCoinClient();
  const response = await client.getOrderbooks({ symbol });

  assert.equal(response.symbol, symbol);
  assert.ok(Array.isArray(response.asks));
  assert.ok(Array.isArray(response.bids));
});

test("public live smoke: trades", async () => {
  const client = new GmoCoinClient();
  const response = await client.getTrades({ symbol, count: 5, page: 1 });

  assert.ok(Array.isArray(response.list));
  assert.ok(response.list.length >= 1);
});

test("public live smoke: klines", async () => {
  const client = new GmoCoinClient();
  const response = await client.getKlines({ symbol, interval: "1day", date: currentYear });

  assert.ok(Array.isArray(response));
  assert.ok(response.length >= 1);
});
