export type EventCallback<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<T = unknown>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((cb) => {
      try { cb(data); } catch (err) { console.error(`EventBus error on "${event}":`, err); }
    });
  }

  once<T = unknown>(event: string, callback: EventCallback<T>): void {
    const wrapper: EventCallback<T> = (data) => { this.off(event, wrapper); callback(data); };
    this.on(event, wrapper);
  }

  removeAllListeners(event?: string): void {
    if (event) this.listeners.delete(event); else this.listeners.clear();
  }

  listenerCount(event: string): number { return this.listeners.get(event)?.size ?? 0; }
}

export const globalEventBus = new EventBus();
