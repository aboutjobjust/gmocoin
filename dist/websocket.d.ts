import type { PrivateSubscription, PublicSubscription } from "./types.ts";
export interface WebSocketLike {
    readonly readyState: number;
    addEventListener(type: "open" | "message" | "close" | "error", listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: "open" | "message" | "close" | "error", listener: EventListenerOrEventListenerObject): void;
    send(data: string): void;
    close(code?: number, reason?: string): void;
}
export type WebSocketFactory = (url: string) => WebSocketLike;
export declare class GmoCoinWebSocketConnection {
    readonly socket: WebSocketLike;
    readonly opened: Promise<void>;
    constructor(socket: WebSocketLike);
    sendJson(payload: unknown): Promise<void>;
    subscribe(message: PublicSubscription | PrivateSubscription): Promise<void>;
    unsubscribe(message: PublicSubscription | PrivateSubscription): Promise<void>;
    subscribeTicker(symbol: string): Promise<void>;
    subscribeOrderbooks(symbol: string): Promise<void>;
    subscribeTrades(symbol: string, option?: "TAKER_ONLY"): Promise<void>;
    subscribeExecutionEvents(): Promise<void>;
    subscribeOrderEvents(): Promise<void>;
    subscribePositionEvents(): Promise<void>;
    subscribePositionSummaryEvents(option?: "PERIODIC"): Promise<void>;
    close(code?: number, reason?: string): void;
}
export declare function resolveWebSocketFactory(webSocketFactory?: WebSocketFactory): WebSocketFactory;
export declare function parseWebSocketMessage<T>(event: MessageEvent<string>): T;
