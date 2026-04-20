export type GmoCoinApiVersion = "v1";
export type FetchLike = typeof fetch;
export type QueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean)[];
export type QueryParams = Record<string, QueryValue>;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}
export interface GmoCoinApiResponse<T> {
    status: number;
    data: T;
    responsetime: string;
}
export interface GmoCoinApiErrorMessage {
    message_code: string;
    message_string: string;
}
export interface GmoCoinApiErrorResponse {
    status?: number;
    responsetime?: string;
    data?: unknown;
    messages?: GmoCoinApiErrorMessage[];
}
export interface Pagination {
    currentPage: number;
    count: number;
}
export interface ListPage<T> {
    pagination: Pagination;
    list: T[];
}
export interface ApiListResult<T> {
    list: T[];
    pagination?: Pagination;
}
export type TradeSide = "BUY" | "SELL";
export type ExecutionType = "MARKET" | "LIMIT" | "STOP";
export type TimeInForce = "FAK" | "FAS" | "FOK" | "SOK";
export type SettleType = "OPEN" | "CLOSE" | "LOSS_CUT";
export type MarginCallStatus = "NORMAL" | "MARGIN_CALL" | "LOSSCUT";
export type ExchangeStatus = "MAINTENANCE" | "PREOPEN" | "OPEN";
export type OrderStatus = "WAITING" | "ORDERED" | "MODIFYING" | "CANCELLING" | "CANCELED" | "EXECUTED" | "EXPIRED";
export type OrderEventStatus = "WAITING" | "ORDERED" | "CANCELED" | "EXPIRED";
export type OrderType = "NORMAL" | "LOSSCUT";
export type PositionEventMessageType = "OPR" | "UPR" | "ULR" | "CPR";
export type PositionSummaryEventMessageType = "INIT" | "UPDATE" | "PERIODIC";
export type KlineInterval = "1min" | "5min" | "10min" | "15min" | "30min" | "1hour" | "4hour" | "8hour" | "12hour" | "1day" | "1week" | "1month";
export interface ExchangeStatusData {
    status: ExchangeStatus;
}
export interface Ticker {
    ask: string;
    bid: string;
    high: string;
    last: string;
    low: string;
    symbol: string;
    timestamp: string;
    volume: string;
}
export interface OrderBookLevel {
    price: string;
    size: string;
}
export interface OrderBook {
    asks: OrderBookLevel[];
    bids: OrderBookLevel[];
    symbol: string;
    timestamp: string;
}
export interface PublicTrade {
    price: string;
    side: TradeSide;
    size: string;
    timestamp: string;
}
export interface Kline {
    openTime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}
export interface SymbolRule {
    symbol: string;
    minOrderSize: string;
    maxOrderSize: string;
    sizeStep: string;
    tickSize: string;
    takerFee: string;
    makerFee: string;
}
export interface MarginInfo {
    actualProfitLoss: string;
    availableAmount: string;
    margin: string;
    marginCallStatus: MarginCallStatus;
    marginRatio: string;
    profitLoss: string;
    transferableAmount: string;
}
export interface AssetBalance {
    amount: string;
    available: string;
    conversionRate: string;
    symbol: string;
}
export interface TradingVolumeLimit {
    symbol: string;
    todayLimitOpenSize?: string;
    todayLimitBuySize?: string;
    todayLimitSellSize?: string;
    takerFee: string;
    makerFee: string;
}
export interface TradingVolume {
    jpyVolume: string;
    tierLevel: number;
    limit: TradingVolumeLimit[];
}
export interface FiatHistoryEntry {
    amount: string;
    fee: string;
    status: "EXECUTED";
    symbol: "JPY";
    timestamp: string;
}
export interface CryptoTransferHistoryEntry {
    address: string;
    amount: string;
    fee: string;
    status: "EXECUTED";
    symbol: string;
    timestamp: string;
    txHash: string;
}
export interface Order {
    rootOrderId: number;
    orderId: number;
    symbol: string;
    side: TradeSide;
    orderType: OrderType;
    executionType: ExecutionType;
    settleType: Extract<SettleType, "OPEN" | "CLOSE">;
    size: string;
    executedSize: string;
    price: string;
    losscutPrice: string;
    status: OrderStatus;
    cancelType?: string;
    timeInForce: TimeInForce;
    timestamp: string;
}
export interface Execution {
    executionId: number;
    orderId: number;
    positionId?: number;
    symbol: string;
    side: TradeSide;
    settleType: Extract<SettleType, "OPEN" | "CLOSE">;
    size: string;
    price: string;
    lossGain: string;
    fee: string;
    timestamp: string;
}
export interface OpenPosition {
    positionId: number;
    symbol: string;
    side: TradeSide;
    size: string;
    orderdSize: string;
    price: string;
    lossGain: string;
    leverage: string;
    losscutPrice: string;
    timestamp: string;
}
export interface PositionSummary {
    averagePositionRate: string;
    positionLossGain: string;
    side: TradeSide;
    sumOrderQuantity: string;
    sumPositionQuantity: string;
    symbol: string;
}
export type TransferType = "WITHDRAWAL" | "DEPOSIT";
export interface TransferRequest {
    amount: string;
    transferType: TransferType;
}
export interface TransferResult {
    transferredAmount: string;
}
export interface CreateOrderRequestBase {
    symbol: string;
    side: TradeSide;
    executionType: ExecutionType;
    timeInForce?: TimeInForce;
    size: string;
    cancelBefore?: boolean;
}
export type CreateOrderRequest = (CreateOrderRequestBase & {
    executionType: "MARKET";
    price?: undefined;
    losscutPrice?: undefined;
}) | (CreateOrderRequestBase & {
    executionType: "LIMIT" | "STOP";
    price: string;
    losscutPrice?: string;
});
export interface ChangeOrderRequest {
    orderId: number;
    price: string;
    losscutPrice?: string;
}
export interface CancelOrderRequest {
    orderId: number;
}
export interface CancelOrdersRequest {
    orderIds: number[];
}
export interface CancelOrdersFailure {
    orderId: number;
    message_code: string;
    message_string: string;
    [key: string]: unknown;
}
export interface CancelOrdersResult {
    success: Array<number | Record<string, unknown>>;
    failed: Array<CancelOrdersFailure | Record<string, unknown>>;
}
export interface CancelBulkOrderRequest {
    symbols: string[];
    side?: TradeSide;
    settleType?: Extract<SettleType, "OPEN" | "CLOSE">;
    desc?: boolean;
}
export interface CancelBulkOrderResult {
    success?: Array<number | Record<string, unknown>>;
    failed?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}
export interface SettlePosition {
    positionId: number;
    size: string;
}
export interface CloseOrderRequestBase {
    symbol: string;
    side: TradeSide;
    executionType: ExecutionType;
    timeInForce?: TimeInForce;
    cancelBefore?: boolean;
}
export type CloseOrderRequest = (CloseOrderRequestBase & {
    executionType: "MARKET";
    price?: undefined;
    settlePosition: [SettlePosition];
}) | (CloseOrderRequestBase & {
    executionType: "LIMIT" | "STOP";
    price: string;
    settlePosition: [SettlePosition];
});
export type CloseBulkOrderRequest = {
    symbol: string;
    side: TradeSide;
    executionType: "MARKET";
    timeInForce?: TimeInForce;
    size: string;
    price?: undefined;
} | {
    symbol: string;
    side: TradeSide;
    executionType: "LIMIT" | "STOP";
    timeInForce?: TimeInForce;
    size: string;
    price: string;
};
export interface ChangeLosscutPriceRequest {
    positionId: number;
    losscutPrice: string;
}
export interface WsAuthTokenRequest {
    token: string;
}
export interface PublicTickerSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "ticker";
    symbol: string;
}
export interface PublicOrderbooksSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "orderbooks";
    symbol: string;
}
export interface PublicTradesSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "trades";
    symbol: string;
    option?: "TAKER_ONLY";
}
export type PublicSubscription = PublicTickerSubscription | PublicOrderbooksSubscription | PublicTradesSubscription;
export interface PrivateExecutionEventsSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "executionEvents";
}
export interface PrivateOrderEventsSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "orderEvents";
}
export interface PrivatePositionEventsSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "positionEvents";
}
export interface PrivatePositionSummaryEventsSubscription {
    command: "subscribe" | "unsubscribe";
    channel: "positionSummaryEvents";
    option?: "PERIODIC";
}
export type PrivateSubscription = PrivateExecutionEventsSubscription | PrivateOrderEventsSubscription | PrivatePositionEventsSubscription | PrivatePositionSummaryEventsSubscription;
export interface PublicTickerMessage {
    channel: "ticker";
    ask: string;
    bid: string;
    high: string;
    last: string;
    low: string;
    symbol: string;
    timestamp: string;
    volume: string;
}
export interface PublicOrderbooksMessage {
    channel: "orderbooks";
    asks: OrderBookLevel[];
    bids: OrderBookLevel[];
    symbol: string;
    timestamp: string;
}
export interface PublicTradeMessage {
    channel: "trades";
    price: string;
    side: TradeSide;
    size: string;
    timestamp: string;
    symbol: string;
}
export type PublicWebSocketMessage = PublicTickerMessage | PublicOrderbooksMessage | PublicTradeMessage;
export interface ExecutionEvent {
    channel: "executionEvents";
    orderId: number;
    executionId: number;
    symbol: string;
    settleType: Extract<SettleType, "OPEN" | "CLOSE">;
    executionType: ExecutionType;
    side: TradeSide;
    executionPrice: string;
    executionSize: string;
    positionId?: number;
    orderTimestamp: string;
    executionTimestamp: string;
    lossGain: string;
    fee: string;
    orderPrice: string;
    orderSize: string;
    orderExecutedSize: string;
    timeInForce: TimeInForce;
    msgType: "ER";
}
export interface OrderEvent {
    channel: "orderEvents";
    orderId: number;
    symbol: string;
    settleType: SettleType;
    executionType: ExecutionType;
    side: TradeSide;
    orderStatus: OrderEventStatus;
    cancelType?: string;
    orderTimestamp: string;
    orderPrice: string;
    orderSize: string;
    orderExecutedSize: string;
    losscutPrice: string;
    timeInForce: TimeInForce;
    msgType: "NOR" | "ROR" | "COR" | "ER";
}
export interface PositionEvent {
    channel: "positionEvents";
    positionId: number;
    symbol: string;
    side: TradeSide;
    size: string;
    orderdSize: string;
    price: string;
    lossGain: string;
    leverage: string;
    losscutPrice: string;
    timestamp: string;
    msgType: PositionEventMessageType;
}
export interface PositionSummaryEvent {
    channel: "positionSummaryEvents";
    symbol: string;
    side: TradeSide;
    averagePositionRate: string;
    positionLossGain: string;
    sumOrderQuantity: string;
    sumPositionQuantity: string;
    timestamp: string;
    msgType: PositionSummaryEventMessageType;
}
export type PrivateWebSocketMessage = ExecutionEvent | OrderEvent | PositionEvent | PositionSummaryEvent;
