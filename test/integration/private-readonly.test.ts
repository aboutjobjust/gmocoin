import { GmoCoinClient } from "../../src/index.ts";
import assert from "../helpers/assert.ts";
import { readTestConfig } from "../helpers/config.ts";
import { test } from "../helpers/harness.ts";

const apiKey = readTestConfig("GMO_TEST_API_KEY");
const secretKey = readTestConfig("GMO_TEST_SECRET_KEY");
const enabled = readTestConfig("GMO_TEST_PRIVATE_READONLY") === "1";

const maybeTest = enabled && apiKey && secretKey ? test : test.skip;

function createReadonlyClient(): GmoCoinClient {
  if (!apiKey || !secretKey) {
    throw new Error("Missing GMO_TEST_API_KEY or GMO_TEST_SECRET_KEY.");
  }

  return new GmoCoinClient({ apiKey, secretKey });
}

maybeTest("private read-only live smoke: margin", async () => {
  const client = createReadonlyClient();
  const response = await client.getMargin();

  assert.equal(response.status, 0);
  assert.equal(typeof response.data.availableAmount, "string");
});

maybeTest("private read-only live smoke: assets", async () => {
  const client = createReadonlyClient();
  const response = await client.getAssets();

  assert.equal(response.status, 0);
  assert.ok(Array.isArray(response.data));
});

maybeTest("private read-only live smoke: trading volume", async () => {
  const client = createReadonlyClient();
  const response = await client.getTradingVolume();

  assert.equal(response.status, 0);
  assert.equal(typeof response.data.jpyVolume, "string");
  assert.ok(Array.isArray(response.data.limit));
});
