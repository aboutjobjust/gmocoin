"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  GmoCoinApiError: () => GmoCoinApiError,
  GmoCoinClient: () => GmoCoinClient,
  GmoCoinWebSocketConnection: () => GmoCoinWebSocketConnection,
  parseWebSocketMessage: () => parseWebSocketMessage
});
module.exports = __toCommonJS(index_exports);

// src/websocket.ts
var OPEN_READY_STATE = 1;
var GmoCoinWebSocketConnection = class {
  socket;
  opened;
  constructor(socket) {
    this.socket = socket;
    this.opened = waitForOpen(socket);
  }
  async sendJson(payload) {
    await this.opened;
    this.socket.send(JSON.stringify(payload));
  }
  async subscribe(message) {
    await this.sendJson({ ...message, command: "subscribe" });
  }
  async unsubscribe(message) {
    await this.sendJson({ ...message, command: "unsubscribe" });
  }
  async subscribeTicker(symbol) {
    await this.subscribe({ channel: "ticker", command: "subscribe", symbol });
  }
  async subscribeOrderbooks(symbol) {
    await this.subscribe({ channel: "orderbooks", command: "subscribe", symbol });
  }
  async subscribeTrades(symbol, option) {
    const message = { channel: "trades", command: "subscribe", symbol };
    if (option) {
      message.option = option;
    }
    await this.subscribe(message);
  }
  async subscribeExecutionEvents() {
    await this.subscribe({ channel: "executionEvents", command: "subscribe" });
  }
  async subscribeOrderEvents() {
    await this.subscribe({ channel: "orderEvents", command: "subscribe" });
  }
  async subscribePositionEvents() {
    await this.subscribe({ channel: "positionEvents", command: "subscribe" });
  }
  async subscribePositionSummaryEvents(option) {
    const message = {
      channel: "positionSummaryEvents",
      command: "subscribe"
    };
    if (option) {
      message.option = option;
    }
    await this.subscribe(message);
  }
  close(code, reason) {
    this.socket.close(code, reason);
  }
};
function resolveWebSocketFactory(webSocketFactory) {
  if (webSocketFactory) {
    return webSocketFactory;
  }
  const globalWebSocket = globalThis.WebSocket;
  if (!globalWebSocket) {
    throw new Error(
      "WebSocket is not available in this runtime. Pass `webSocketFactory` explicitly."
    );
  }
  return (url) => new globalWebSocket(url);
}
function parseWebSocketMessage(event) {
  if (typeof event.data !== "string") {
    throw new Error("Expected a text WebSocket message.");
  }
  return JSON.parse(event.data);
}
function waitForOpen(socket) {
  if (socket.readyState === OPEN_READY_STATE) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Failed to open WebSocket connection."));
    };
    const onClose = () => {
      cleanup();
      reject(new Error("WebSocket connection closed before it became ready."));
    };
    const cleanup = () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
    socket.addEventListener("open", onOpen);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);
  });
}

// src/client.ts
var encoder = new TextEncoder();
var GmoCoinApiError = class extends Error {
  httpStatus;
  apiStatus;
  response;
  constructor(message, httpStatus, response) {
    super(message);
    this.name = "GmoCoinApiError";
    this.httpStatus = httpStatus;
    this.apiStatus = typeof response === "object" && response ? response.status : void 0;
    this.response = response;
  }
};
var GmoCoinClient = class {
  apiKey;
  secretKey;
  fetchImpl;
  now;
  publicBaseUrl;
  privateBaseUrl;
  publicWebSocketBaseUrl;
  privateWebSocketBaseUrl;
  webSocketFactory;
  signingKeyPromise;
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.secretKey = options.secretKey;
    this.fetchImpl = options.fetch ?? getDefaultFetch();
    this.now = options.now ?? (() => Date.now());
    this.publicBaseUrl = stripTrailingSlash(options.publicBaseUrl ?? "https://api.coin.z.com/public");
    this.privateBaseUrl = stripTrailingSlash(options.privateBaseUrl ?? "https://api.coin.z.com/private");
    this.publicWebSocketBaseUrl = stripTrailingSlash(
      options.publicWebSocketBaseUrl ?? "wss://api.coin.z.com/ws/public"
    );
    this.privateWebSocketBaseUrl = stripTrailingSlash(
      options.privateWebSocketBaseUrl ?? "wss://api.coin.z.com/ws/private"
    );
    this.webSocketFactory = options.webSocketFactory;
  }
  async requestPublic(path, options = {}) {
    return this.request(this.publicBaseUrl, path, "GET", options);
  }
  async requestPublicData(path, options = {}) {
    const response = await this.requestPublic(path, options);
    return response.data;
  }
  async requestPrivate(path, method, options = {}) {
    this.assertPrivateCredentials();
    return this.request(this.privateBaseUrl, path, method, options, true);
  }
  async requestPrivateData(path, method, options = {}) {
    const response = await this.requestPrivate(path, method, options);
    return response.data;
  }
  getStatus() {
    return this.requestPublicData("/v1/status");
  }
  getTicker(params = {}) {
    return this.requestPublicData("/v1/ticker", { query: params });
  }
  getOrderbooks(params) {
    return this.requestPublicData("/v1/orderbooks", { query: params });
  }
  getTrades(params) {
    return this.requestPublicData("/v1/trades", {
      query: params
    });
  }
  getKlines(params) {
    return this.requestPublicData("/v1/klines", { query: params });
  }
  getSymbols() {
    return this.requestPublicData("/v1/symbols");
  }
  getMargin() {
    return this.requestPrivateData("/v1/account/margin", "GET");
  }
  getAssets() {
    return this.requestPrivateData("/v1/account/assets", "GET");
  }
  getTradingVolume() {
    return this.requestPrivateData("/v1/account/tradingVolume", "GET");
  }
  getFiatDepositHistory(params) {
    return this.requestPrivateData("/v1/account/fiatDeposit/history", "GET", {
      query: params
    });
  }
  getFiatWithdrawalHistory(params) {
    return this.requestPrivateData("/v1/account/fiatWithdrawal/history", "GET", {
      query: params
    });
  }
  getDepositHistory(params) {
    return this.requestPrivateData("/v1/account/deposit/history", "GET", {
      query: params
    });
  }
  getWithdrawalHistory(params) {
    return this.requestPrivateData(
      "/v1/account/withdrawal/history",
      "GET",
      { query: params }
    );
  }
  getOrders(params) {
    return this.requestPrivateData("/v1/orders", "GET", {
      query: { orderId: normalizeCsvParam(params.orderId) }
    });
  }
  getActiveOrders(params) {
    return this.requestPrivateData("/v1/activeOrders", "GET", { query: params });
  }
  getExecutions(params) {
    if (params.orderId == null && params.executionId == null) {
      throw new Error("Either `orderId` or `executionId` is required.");
    }
    return this.requestPrivateData("/v1/executions", "GET", {
      query: {
        orderId: params.orderId,
        executionId: params.executionId == null ? void 0 : normalizeCsvParam(params.executionId)
      }
    });
  }
  getLatestExecutions(params) {
    return this.requestPrivateData("/v1/latestExecutions", "GET", {
      query: params
    });
  }
  getOpenPositions(params) {
    return this.requestPrivateData("/v1/openPositions", "GET", {
      query: params
    });
  }
  getPositionSummary(params = {}) {
    return this.requestPrivateData("/v1/positionSummary", "GET", { query: params });
  }
  transfer(body) {
    return this.requestPrivateData("/v1/account/transfer", "POST", { body });
  }
  createOrder(body) {
    return this.requestPrivateData("/v1/order", "POST", { body });
  }
  changeOrder(body) {
    return this.requestPrivateData("/v1/changeOrder", "POST", { body });
  }
  cancelOrder(body) {
    return this.requestPrivateData("/v1/cancelOrder", "POST", { body });
  }
  cancelOrders(body) {
    return this.requestPrivateData("/v1/cancelOrders", "POST", { body });
  }
  cancelBulkOrder(body) {
    return this.requestPrivateData("/v1/cancelBulkOrder", "POST", { body });
  }
  closeOrder(body) {
    return this.requestPrivateData("/v1/closeOrder", "POST", { body });
  }
  closeBulkOrder(body) {
    return this.requestPrivateData("/v1/closeBulkOrder", "POST", { body });
  }
  changeLosscutPrice(body) {
    return this.requestPrivateData("/v1/changeLosscutPrice", "POST", { body });
  }
  createWebSocketToken() {
    return this.requestPrivateData("/v1/ws-auth", "POST", { body: {} });
  }
  extendWebSocketToken(body) {
    return this.requestPrivateData("/v1/ws-auth", "PUT", {
      body,
      includeBodyInSignature: false
    });
  }
  deleteWebSocketToken(body) {
    return this.requestPrivateData("/v1/ws-auth", "DELETE", {
      body,
      includeBodyInSignature: false
    });
  }
  connectPublicWebSocket() {
    const socket = this.getWebSocketFactory()(`${this.publicWebSocketBaseUrl}/v1`);
    return new GmoCoinWebSocketConnection(socket);
  }
  connectPrivateWebSocket(token) {
    const socket = this.getWebSocketFactory()(
      `${this.privateWebSocketBaseUrl}/v1/${encodeURIComponent(token)}`
    );
    return new GmoCoinWebSocketConnection(socket);
  }
  async request(baseUrl, path, method, options, signed = false) {
    const url = new URL(`${baseUrl}${path}`);
    applyQueryParams(url, options.query);
    const bodyText = options.body === void 0 ? void 0 : JSON.stringify(options.body);
    const headers = new Headers();
    if (bodyText !== void 0) {
      headers.set("content-type", "application/json");
    }
    if (signed) {
      const timestamp = String(this.now());
      const signatureBase = timestamp + method + path + (shouldIncludeBodyInSignature(method, options) ? bodyText ?? "" : "");
      headers.set("API-KEY", this.apiKey);
      headers.set("API-TIMESTAMP", timestamp);
      headers.set("API-SIGN", await this.sign(signatureBase));
    }
    const requestInit = {
      method,
      headers
    };
    if (bodyText !== void 0) {
      requestInit.body = bodyText;
    }
    const response = await this.fetchImpl(url, requestInit);
    const text = await response.text();
    const payload = parseJsonSafely(text);
    if (!response.ok) {
      throw new GmoCoinApiError(buildErrorMessage(response.status, payload), response.status, payload);
    }
    if (!payload || typeof payload !== "object") {
      throw new GmoCoinApiError("The API returned a non-JSON response.", response.status, payload);
    }
    const apiResponse = payload;
    if (apiResponse.status !== 0) {
      throw new GmoCoinApiError(buildErrorMessage(response.status, apiResponse), response.status, apiResponse);
    }
    return apiResponse;
  }
  assertPrivateCredentials() {
    if (!this.apiKey || !this.secretKey) {
      throw new Error("Private API access requires both `apiKey` and `secretKey`.");
    }
  }
  async sign(text) {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error("Web Crypto is not available in this runtime.");
    }
    this.signingKeyPromise ??= subtle.importKey(
      "raw",
      encoder.encode(this.secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const key = await this.signingKeyPromise;
    const signature = await subtle.sign("HMAC", key, encoder.encode(text));
    return toHex(new Uint8Array(signature));
  }
  getWebSocketFactory() {
    return resolveWebSocketFactory(this.webSocketFactory);
  }
};
function getDefaultFetch() {
  if (!globalThis.fetch) {
    throw new Error("fetch is not available in this runtime. Pass `fetch` explicitly.");
  }
  return globalThis.fetch.bind(globalThis);
}
function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
function shouldIncludeBodyInSignature(method, options) {
  if (options.includeBodyInSignature !== void 0) {
    return options.includeBodyInSignature;
  }
  return method !== "GET" && options.body !== void 0;
}
function applyQueryParams(url, params) {
  if (!params) {
    return;
  }
  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.map((item) => String(item)).join(","));
      continue;
    }
    url.searchParams.set(key, String(value));
  }
}
function normalizeCsvParam(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(",");
  }
  return String(value);
}
function parseJsonSafely(text) {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function buildErrorMessage(statusCode, payload) {
  if (typeof payload === "string" && payload) {
    return `GMO Coin API request failed (${statusCode}): ${payload}`;
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.messages) && payload.messages.length > 0) {
    const details = payload.messages.map((message) => `${message.message_code}: ${message.message_string}`).join(", ");
    return `GMO Coin API request failed (${statusCode}): ${details}`;
  }
  return `GMO Coin API request failed (${statusCode}).`;
}
function toHex(bytes) {
  let result = "";
  for (const value of bytes) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}
//# sourceMappingURL=index.cjs.map