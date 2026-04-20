import type {
  ApiListResult,
  AssetBalance,
  CancelBulkOrderRequest,
  CancelBulkOrderResult,
  CancelOrderRequest,
  CancelOrdersRequest,
  CancelOrdersResult,
  ChangeLosscutPriceRequest,
  ChangeOrderRequest,
  CloseBulkOrderRequest,
  CloseOrderRequest,
  CreateOrderRequest,
  CryptoTransferHistoryEntry,
  Execution,
  ExchangeStatusData,
  FetchLike,
  FiatHistoryEntry,
  GmoCoinApiErrorResponse,
  GmoCoinApiResponse,
  Kline,
  MarginInfo,
  OpenPosition,
  Order,
  OrderBook,
  Pagination,
  PositionSummary,
  QueryParams,
  SymbolRule,
  Ticker,
  TradingVolume,
  TransferRequest,
  TransferResult,
  WsAuthTokenRequest
} from "./types.ts";
import {
  GmoCoinWebSocketConnection,
  resolveWebSocketFactory,
  type WebSocketFactory
} from "./websocket.ts";

const encoder = new TextEncoder();

export interface GmoCoinClientOptions {
  apiKey?: string;
  secretKey?: string;
  fetch?: FetchLike;
  now?: () => number;
  publicBaseUrl?: string;
  privateBaseUrl?: string;
  publicWebSocketBaseUrl?: string;
  privateWebSocketBaseUrl?: string;
  webSocketFactory?: WebSocketFactory;
}

interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  includeBodyInSignature?: boolean;
}

export class GmoCoinApiError extends Error {
  readonly httpStatus: number;
  readonly apiStatus: number | undefined;
  readonly response: GmoCoinApiErrorResponse | string | null;

  constructor(message: string, httpStatus: number, response: GmoCoinApiErrorResponse | string | null) {
    super(message);
    this.name = "GmoCoinApiError";
    this.httpStatus = httpStatus;
    this.apiStatus = typeof response === "object" && response ? response.status : undefined;
    this.response = response;
  }
}

export class GmoCoinClient {
  private readonly apiKey: string | undefined;
  private readonly secretKey: string | undefined;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly publicBaseUrl: string;
  private readonly privateBaseUrl: string;
  private readonly publicWebSocketBaseUrl: string;
  private readonly privateWebSocketBaseUrl: string;
  private readonly webSocketFactory: WebSocketFactory;
  private signingKeyPromise?: Promise<CryptoKey>;

  constructor(options: GmoCoinClientOptions = {}) {
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
    this.webSocketFactory = resolveWebSocketFactory(options.webSocketFactory);
  }

  async requestPublic<T>(path: string, options: Omit<RequestOptions, "includeBodyInSignature"> = {}) {
    return this.request<T>(this.publicBaseUrl, path, "GET", options);
  }

  async requestPrivate<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    options: RequestOptions = {}
  ) {
    this.assertPrivateCredentials();
    return this.request<T>(this.privateBaseUrl, path, method, options, true);
  }

  getStatus() {
    return this.requestPublic<ExchangeStatusData>("/v1/status");
  }

  getTicker(params: { symbol?: string } = {}) {
    return this.requestPublic<Ticker[]>("/v1/ticker", { query: params });
  }

  getOrderbooks(params: { symbol: string }) {
    return this.requestPublic<OrderBook>("/v1/orderbooks", { query: params });
  }

  getTrades(params: { symbol: string; page?: number; count?: number }) {
    return this.requestPublic<ApiListResult<import("./types.ts").PublicTrade>>("/v1/trades", { query: params });
  }

  getKlines(params: { symbol: string; interval: import("./types.ts").KlineInterval; date: string }) {
    return this.requestPublic<Kline[]>("/v1/klines", { query: params });
  }

  getSymbols() {
    return this.requestPublic<SymbolRule[]>("/v1/symbols");
  }

  getMargin() {
    return this.requestPrivate<MarginInfo>("/v1/account/margin", "GET");
  }

  getAssets() {
    return this.requestPrivate<AssetBalance[]>("/v1/account/assets", "GET");
  }

  getTradingVolume() {
    return this.requestPrivate<TradingVolume>("/v1/account/tradingVolume", "GET");
  }

  getFiatDepositHistory(params: { fromTimestamp: string; toTimestamp?: string }) {
    return this.requestPrivate<FiatHistoryEntry[]>("/v1/account/fiatDeposit/history", "GET", {
      query: params
    });
  }

  getFiatWithdrawalHistory(params: { fromTimestamp: string; toTimestamp?: string }) {
    return this.requestPrivate<FiatHistoryEntry[]>("/v1/account/fiatWithdrawal/history", "GET", {
      query: params
    });
  }

  getDepositHistory(params: { symbol: string; fromTimestamp: string; toTimestamp?: string }) {
    return this.requestPrivate<CryptoTransferHistoryEntry[]>("/v1/account/deposit/history", "GET", {
      query: params
    });
  }

  getWithdrawalHistory(params: { symbol: string; fromTimestamp: string; toTimestamp?: string }) {
    return this.requestPrivate<CryptoTransferHistoryEntry[]>("/v1/account/withdrawal/history", "GET", {
      query: params
    });
  }

  getOrders(params: { orderId: string | number | readonly (string | number)[] }) {
    return this.requestPrivate<ApiListResult<Order>>("/v1/orders", "GET", {
      query: { orderId: normalizeCsvParam(params.orderId) }
    });
  }

  getActiveOrders(params: { symbol: string; page?: number; count?: number }) {
    return this.requestPrivate<ApiListResult<Order>>("/v1/activeOrders", "GET", { query: params });
  }

  getExecutions(params: { orderId?: number; executionId?: string | number | readonly (string | number)[] }) {
    if (params.orderId == null && params.executionId == null) {
      throw new Error("Either `orderId` or `executionId` is required.");
    }

    return this.requestPrivate<ApiListResult<Execution>>("/v1/executions", "GET", {
      query: {
        orderId: params.orderId,
        executionId: params.executionId == null ? undefined : normalizeCsvParam(params.executionId)
      }
    });
  }

  getLatestExecutions(params: { symbol: string; page?: number; count?: number }) {
    return this.requestPrivate<ApiListResult<Execution>>("/v1/latestExecutions", "GET", {
      query: params
    });
  }

  getOpenPositions(params: { symbol: string; page?: number; count?: number }) {
    return this.requestPrivate<ApiListResult<OpenPosition>>("/v1/openPositions", "GET", {
      query: params
    });
  }

  getPositionSummary(params: { symbol?: string } = {}) {
    return this.requestPrivate<PositionSummary[]>("/v1/positionSummary", "GET", { query: params });
  }

  transfer(body: TransferRequest) {
    return this.requestPrivate<TransferResult>("/v1/account/transfer", "POST", { body });
  }

  createOrder(body: CreateOrderRequest) {
    return this.requestPrivate<string>("/v1/order", "POST", { body });
  }

  changeOrder(body: ChangeOrderRequest) {
    return this.requestPrivate<undefined>("/v1/changeOrder", "POST", { body });
  }

  cancelOrder(body: CancelOrderRequest) {
    return this.requestPrivate<undefined>("/v1/cancelOrder", "POST", { body });
  }

  cancelOrders(body: CancelOrdersRequest) {
    return this.requestPrivate<CancelOrdersResult>("/v1/cancelOrders", "POST", { body });
  }

  cancelBulkOrder(body: CancelBulkOrderRequest) {
    return this.requestPrivate<CancelBulkOrderResult>("/v1/cancelBulkOrder", "POST", { body });
  }

  closeOrder(body: CloseOrderRequest) {
    return this.requestPrivate<string>("/v1/closeOrder", "POST", { body });
  }

  closeBulkOrder(body: CloseBulkOrderRequest) {
    return this.requestPrivate<string>("/v1/closeBulkOrder", "POST", { body });
  }

  changeLosscutPrice(body: ChangeLosscutPriceRequest) {
    return this.requestPrivate<undefined>("/v1/changeLosscutPrice", "POST", { body });
  }

  createWebSocketToken() {
    return this.requestPrivate<string>("/v1/ws-auth", "POST", { body: {} });
  }

  extendWebSocketToken(body: WsAuthTokenRequest) {
    return this.requestPrivate<undefined>("/v1/ws-auth", "PUT", {
      body,
      includeBodyInSignature: false
    });
  }

  deleteWebSocketToken(body: WsAuthTokenRequest) {
    return this.requestPrivate<undefined>("/v1/ws-auth", "DELETE", {
      body,
      includeBodyInSignature: false
    });
  }

  connectPublicWebSocket() {
    const socket = this.webSocketFactory(`${this.publicWebSocketBaseUrl}/v1`);
    return new GmoCoinWebSocketConnection(socket);
  }

  connectPrivateWebSocket(token: string) {
    const socket = this.webSocketFactory(`${this.privateWebSocketBaseUrl}/v1/${encodeURIComponent(token)}`);
    return new GmoCoinWebSocketConnection(socket);
  }

  private async request<T>(
    baseUrl: string,
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    options: RequestOptions,
    signed = false
  ): Promise<GmoCoinApiResponse<T>> {
    const url = new URL(`${baseUrl}${path}`);
    applyQueryParams(url, options.query);

    const bodyText = options.body === undefined ? undefined : JSON.stringify(options.body);
    const headers = new Headers();
    if (bodyText !== undefined) {
      headers.set("content-type", "application/json");
    }

    if (signed) {
      const timestamp = String(this.now());
      const signatureBase =
        timestamp + method + path + (shouldIncludeBodyInSignature(method, options) ? bodyText ?? "" : "");
      headers.set("API-KEY", this.apiKey!);
      headers.set("API-TIMESTAMP", timestamp);
      headers.set("API-SIGN", await this.sign(signatureBase));
    }

    const requestInit: RequestInit = {
      method,
      headers
    };
    if (bodyText !== undefined) {
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

    const apiResponse = payload as GmoCoinApiResponse<T> & GmoCoinApiErrorResponse;
    if (apiResponse.status !== 0) {
      throw new GmoCoinApiError(buildErrorMessage(response.status, apiResponse), response.status, apiResponse);
    }

    return apiResponse;
  }

  private assertPrivateCredentials(): void {
    if (!this.apiKey || !this.secretKey) {
      throw new Error("Private API access requires both `apiKey` and `secretKey`.");
    }
  }

  private async sign(text: string): Promise<string> {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error("Web Crypto is not available in this runtime.");
    }

    this.signingKeyPromise ??= subtle.importKey(
      "raw",
      encoder.encode(this.secretKey!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const key = await this.signingKeyPromise;
    const signature = await subtle.sign("HMAC", key, encoder.encode(text));
    return toHex(new Uint8Array(signature));
  }
}

function getDefaultFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("fetch is not available in this runtime. Pass `fetch` explicitly.");
  }
  return globalThis.fetch.bind(globalThis);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function shouldIncludeBodyInSignature(
  method: "GET" | "POST" | "PUT" | "DELETE",
  options: RequestOptions
): boolean {
  if (options.includeBodyInSignature !== undefined) {
    return options.includeBodyInSignature;
  }
  return method !== "GET" && options.body !== undefined;
}

function applyQueryParams(url: URL, params?: QueryParams): void {
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

function normalizeCsvParam(value: string | number | readonly (string | number)[]): string {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(",");
  }
  return String(value);
}

function parseJsonSafely(text: string): GmoCoinApiErrorResponse | string | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as GmoCoinApiErrorResponse;
  } catch {
    return text;
  }
}

function buildErrorMessage(statusCode: number, payload: GmoCoinApiErrorResponse | string | null): string {
  if (typeof payload === "string" && payload) {
    return `GMO Coin API request failed (${statusCode}): ${payload}`;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.messages) && payload.messages.length > 0) {
    const details = payload.messages
      .map((message) => `${message.message_code}: ${message.message_string}`)
      .join(", ");
    return `GMO Coin API request failed (${statusCode}): ${details}`;
  }

  return `GMO Coin API request failed (${statusCode}).`;
}

function toHex(bytes: Uint8Array): string {
  let result = "";
  for (const value of bytes) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}
