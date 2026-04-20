import type {
  MarketSymbol,
  PrivatePositionSummaryEventsSubscription,
  PrivateSubscription,
  PublicSubscription
} from "./types.ts";

export interface WebSocketLike {
  readonly readyState: number;
  addEventListener(
    type: "open" | "message" | "close" | "error",
    listener: EventListenerOrEventListenerObject
  ): void;
  removeEventListener(
    type: "open" | "message" | "close" | "error",
    listener: EventListenerOrEventListenerObject
  ): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

const OPEN_READY_STATE = 1;

export class GmoCoinWebSocketConnection {
  readonly socket: WebSocketLike;
  readonly opened: Promise<void>;

  constructor(socket: WebSocketLike) {
    this.socket = socket;
    this.opened = waitForOpen(socket);
  }

  async sendJson(payload: unknown): Promise<void> {
    await this.opened;
    this.socket.send(JSON.stringify(payload));
  }

  async subscribe(message: PublicSubscription | PrivateSubscription): Promise<void> {
    await this.sendJson({ ...message, command: "subscribe" });
  }

  async unsubscribe(message: PublicSubscription | PrivateSubscription): Promise<void> {
    await this.sendJson({ ...message, command: "unsubscribe" });
  }

  async subscribeTicker(symbol: MarketSymbol): Promise<void> {
    await this.subscribe({ channel: "ticker", command: "subscribe", symbol });
  }

  async subscribeOrderbooks(symbol: MarketSymbol): Promise<void> {
    await this.subscribe({ channel: "orderbooks", command: "subscribe", symbol });
  }

  async subscribeTrades(symbol: MarketSymbol, option?: "TAKER_ONLY"): Promise<void> {
    const message: PublicSubscription = { channel: "trades", command: "subscribe", symbol };
    if (option) {
      message.option = option;
    }
    await this.subscribe(message);
  }

  async subscribeExecutionEvents(): Promise<void> {
    await this.subscribe({ channel: "executionEvents", command: "subscribe" });
  }

  async subscribeOrderEvents(): Promise<void> {
    await this.subscribe({ channel: "orderEvents", command: "subscribe" });
  }

  async subscribePositionEvents(): Promise<void> {
    await this.subscribe({ channel: "positionEvents", command: "subscribe" });
  }

  async subscribePositionSummaryEvents(option?: "PERIODIC"): Promise<void> {
    const message: PrivatePositionSummaryEventsSubscription = {
      channel: "positionSummaryEvents",
      command: "subscribe"
    };
    if (option) {
      message.option = option;
    }
    await this.subscribe(message);
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }
}

export function resolveWebSocketFactory(webSocketFactory?: WebSocketFactory): WebSocketFactory {
  if (webSocketFactory) {
    return webSocketFactory;
  }

  const globalWebSocket = globalThis.WebSocket;
  if (!globalWebSocket) {
    throw new Error(
      "WebSocket is not available in this runtime. Pass `webSocketFactory` explicitly."
    );
  }

  return (url: string) => new globalWebSocket(url) as unknown as WebSocketLike;
}

export function parseWebSocketMessage<T>(event: MessageEvent<string>): T {
  if (typeof event.data !== "string") {
    throw new Error("Expected a text WebSocket message.");
  }
  return JSON.parse(event.data) as T;
}

function waitForOpen(socket: WebSocketLike): Promise<void> {
  if (socket.readyState === OPEN_READY_STATE) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
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
