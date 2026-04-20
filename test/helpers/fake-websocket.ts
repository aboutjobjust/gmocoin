type Listener = EventListenerOrEventListenerObject;
type EventType = "open" | "message" | "close" | "error";

export class FakeWebSocket {
  readyState: number;
  sent: string[] = [];

  private readonly listeners = new Map<EventType, Set<Listener>>();

  constructor(readyState = 1) {
    this.readyState = readyState;
  }

  addEventListener(type: EventType, listener: Listener): void {
    const current = this.listeners.get(type) ?? new Set<Listener>();
    current.add(listener);
    this.listeners.set(type, current);
  }

  removeEventListener(type: EventType, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", new Event("close"));
  }

  open(): void {
    this.readyState = 1;
    this.emit("open", new Event("open"));
  }

  emitMessage(text: string): void {
    this.emit("message", new MessageEvent("message", { data: text }));
  }

  emitError(): void {
    this.emit("error", new Event("error"));
  }

  private emit(type: EventType, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") {
        listener.call(this, event);
      } else {
        listener.handleEvent(event);
      }
    }
  }
}
