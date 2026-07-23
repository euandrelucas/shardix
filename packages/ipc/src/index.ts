import EventEmitter from 'eventemitter3';

export interface MessageTransport {
  send(targetWorkerId: string, topic: string, payload: any): Promise<void>;
  broadcast(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload: any) => void): void;
}

export class LocalIPCTransport implements MessageTransport {
  private static bus = new EventEmitter();

  public async send(targetWorkerId: string, topic: string, payload: any): Promise<void> {
    LocalIPCTransport.bus.emit(`worker:${targetWorkerId}:${topic}`, payload);
    LocalIPCTransport.bus.emit(topic, { targetWorkerId, payload });
  }

  public async broadcast(topic: string, payload: any): Promise<void> {
    LocalIPCTransport.bus.emit(topic, payload);
  }

  public subscribe(topic: string, handler: (payload: any) => void): void {
    LocalIPCTransport.bus.on(topic, handler);
  }
}
