import assert from "node:assert/strict";
import test from "node:test";

import { GmoCoinWebSocketConnection, parseWebSocketMessage } from "../../src/index.ts";
import { resolveWebSocketFactory } from "../../src/websocket.ts";
import { FakeWebSocket } from "../helpers/fake-websocket.ts";

test("parseWebSocketMessage parses text payloads", () => {
  const event = new MessageEvent("message", {
    data: JSON.stringify({ channel: "ticker", last: "123" })
  });

  const message = parseWebSocketMessage<{ channel: string; last: string }>(event);
  assert.deepEqual(message, { channel: "ticker", last: "123" });
});

test("parseWebSocketMessage rejects non-text payloads", () => {
  const event = new MessageEvent("message", { data: new Blob(["abc"]) as unknown as string });
  assert.throws(() => parseWebSocketMessage(event), /Expected a text WebSocket message/);
});

test("subscribe sends JSON immediately when the socket is already open", async () => {
  const socket = new FakeWebSocket(1);
  const connection = new GmoCoinWebSocketConnection(socket);

  await connection.subscribeTicker("BTC");

  assert.deepEqual(socket.sent, ['{"channel":"ticker","command":"subscribe","symbol":"BTC"}']);
});

test("sendJson waits until the socket opens", async () => {
  const socket = new FakeWebSocket(0);
  const connection = new GmoCoinWebSocketConnection(socket);

  const sendPromise = connection.subscribeExecutionEvents();
  assert.equal(socket.sent.length, 0);

  socket.open();
  await sendPromise;

  assert.deepEqual(socket.sent, ['{"channel":"executionEvents","command":"subscribe"}']);
});

test("opened rejects if the socket closes before opening", async () => {
  const socket = new FakeWebSocket(0);
  const connection = new GmoCoinWebSocketConnection(socket);

  const opened = connection.opened;
  socket.close();

  await assert.rejects(() => opened, /closed before it became ready/);
});

test("resolveWebSocketFactory uses the injected factory", () => {
  const socket = new FakeWebSocket(1);
  const factory = resolveWebSocketFactory(() => socket);

  assert.equal(factory("wss://example.invalid"), socket);
});
