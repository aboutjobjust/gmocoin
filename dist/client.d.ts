import type { ApiListResult, AssetBalance, CancelBulkOrderRequest, CancelBulkOrderResult, CancelOrderRequest, CancelOrdersRequest, CancelOrdersResult, ChangeLosscutPriceRequest, ChangeOrderRequest, CloseBulkOrderRequest, CloseOrderRequest, CreateOrderRequest, CryptoTransferHistoryEntry, Execution, ExchangeStatusData, FetchLike, FiatHistoryEntry, GmoCoinApiErrorResponse, GmoCoinApiResponse, KlineInterval, LeverageSymbol, Kline, MarginInfo, MarketSymbol, OpenPosition, Order, OrderBook, PositionSummary, QueryParams, SpotSymbol, SymbolRule, Ticker, TradingVolume, TransferRequest, TransferResult, WsAuthTokenRequest } from "./types.ts";
import { GmoCoinWebSocketConnection, type WebSocketFactory } from "./websocket.ts";
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
type CsvIdParam = string | number | readonly (string | number)[];
type ExecutionLookupParams = {
    orderId: number;
    executionId?: undefined;
} | {
    orderId?: undefined;
    executionId: CsvIdParam;
};
export declare class GmoCoinApiError extends Error {
    readonly httpStatus: number;
    readonly apiStatus: number | undefined;
    readonly response: GmoCoinApiErrorResponse | string | null;
    constructor(message: string, httpStatus: number, response: GmoCoinApiErrorResponse | string | null);
}
export declare class GmoCoinClient {
    private readonly apiKey;
    private readonly secretKey;
    private readonly fetchImpl;
    private readonly now;
    private readonly publicBaseUrl;
    private readonly privateBaseUrl;
    private readonly publicWebSocketBaseUrl;
    private readonly privateWebSocketBaseUrl;
    private readonly webSocketFactory;
    private signingKeyPromise?;
    constructor(options?: GmoCoinClientOptions);
    requestPublic<T>(path: string, options?: Omit<RequestOptions, "includeBodyInSignature">): Promise<GmoCoinApiResponse<T>>;
    requestPublicData<T>(path: string, options?: Omit<RequestOptions, "includeBodyInSignature">): Promise<T>;
    requestPrivate<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE", options?: RequestOptions): Promise<GmoCoinApiResponse<T>>;
    requestPrivateData<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE", options?: RequestOptions): Promise<T>;
    getStatus(): Promise<ExchangeStatusData>;
    getTicker(params?: {
        symbol?: MarketSymbol;
    }): Promise<Ticker[]>;
    getOrderbooks(params: {
        symbol: MarketSymbol;
    }): Promise<OrderBook>;
    getTrades(params: {
        symbol: MarketSymbol;
        page?: number;
        count?: number;
    }): Promise<ApiListResult<import("./types.ts").PublicTrade>>;
    getKlines(params: {
        symbol: MarketSymbol;
        interval: KlineInterval;
        date: string;
    }): Promise<Kline[]>;
    getSymbols(): Promise<SymbolRule[]>;
    getMargin(): Promise<MarginInfo>;
    getAssets(): Promise<AssetBalance[]>;
    getTradingVolume(): Promise<TradingVolume>;
    getFiatDepositHistory(params: {
        fromTimestamp: string;
        toTimestamp?: string;
    }): Promise<FiatHistoryEntry[]>;
    getFiatWithdrawalHistory(params: {
        fromTimestamp: string;
        toTimestamp?: string;
    }): Promise<FiatHistoryEntry[]>;
    getDepositHistory(params: {
        symbol: SpotSymbol;
        fromTimestamp: string;
        toTimestamp?: string;
    }): Promise<CryptoTransferHistoryEntry[]>;
    getWithdrawalHistory(params: {
        symbol: SpotSymbol;
        fromTimestamp: string;
        toTimestamp?: string;
    }): Promise<CryptoTransferHistoryEntry[]>;
    getOrders(params: {
        orderId: string | number | readonly (string | number)[];
    }): Promise<ApiListResult<Order>>;
    getActiveOrders(params: {
        symbol: MarketSymbol;
        page?: number;
        count?: number;
    }): Promise<ApiListResult<Order>>;
    getExecutions(params: ExecutionLookupParams): Promise<ApiListResult<Execution>>;
    getLatestExecutions(params: {
        symbol: MarketSymbol;
        page?: number;
        count?: number;
    }): Promise<ApiListResult<Execution>>;
    getOpenPositions(params: {
        symbol: LeverageSymbol;
        page?: number;
        count?: number;
    }): Promise<ApiListResult<OpenPosition>>;
    getPositionSummary(params?: {
        symbol?: LeverageSymbol;
    }): Promise<PositionSummary[]>;
    transfer(body: TransferRequest): Promise<TransferResult>;
    createOrder(body: CreateOrderRequest): Promise<string>;
    changeOrder(body: ChangeOrderRequest): Promise<undefined>;
    cancelOrder(body: CancelOrderRequest): Promise<undefined>;
    cancelOrders(body: CancelOrdersRequest): Promise<CancelOrdersResult>;
    cancelBulkOrder(body: CancelBulkOrderRequest): Promise<CancelBulkOrderResult>;
    closeOrder(body: CloseOrderRequest): Promise<string>;
    closeBulkOrder(body: CloseBulkOrderRequest): Promise<string>;
    changeLosscutPrice(body: ChangeLosscutPriceRequest): Promise<undefined>;
    createWebSocketToken(): Promise<string>;
    extendWebSocketToken(body: WsAuthTokenRequest): Promise<undefined>;
    deleteWebSocketToken(body: WsAuthTokenRequest): Promise<undefined>;
    connectPublicWebSocket(): GmoCoinWebSocketConnection;
    connectPrivateWebSocket(token: string): GmoCoinWebSocketConnection;
    private request;
    private assertPrivateCredentials;
    private sign;
    private getWebSocketFactory;
}
export {};
