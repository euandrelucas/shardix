import { DiscordAdapter, RawDiscordEvent, InteractionPayload, Type } from '@shardix/common';
import { ShardixApplication, ShardixFactory, AutoScanner } from '@shardix/core';

export class MockDiscordAdapter implements DiscordAdapter<any> {
  public readonly name = 'MockDiscordAdapter';
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private eventHandlers = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();
  public responses: any[] = [];
  public isConnected = false;

  public getClient(): any {
    return {
      on: (event: string, fn: any) => this.onEvent(event, fn),
      emit: (event: string, ...args: any[]) => this.emitEvent(event, ...args),
    };
  }

  public async login(token?: string): Promise<void> {
    this.isConnected = true;
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    this.responses.push({ interactionId, token, body });
  }

  public onEvent(eventName: string, handler: (...args: any[]) => void | Promise<void>): void {
    const list = this.eventHandlers.get(eventName) || [];
    list.push(handler);
    this.eventHandlers.set(eventName, list);
  }

  public async emitEvent(eventName: string, ...args: any[]): Promise<void> {
    const handlers = this.eventHandlers.get(eventName) || [];
    for (const h of handlers) {
      await h(...args);
    }
  }

  public async emitRawPayload(payload: RawDiscordEvent): Promise<void> {
    if (this.rawHandler) {
      await this.rawHandler(payload);
    }
  }
}

export interface TestingApplicationOptions {
  controllers?: Type<any>[];
  providers?: any[];
  modules?: Type<any>[];
}

export class TestingApplication {
  public readonly app: ShardixApplication;
  public readonly mockAdapter: MockDiscordAdapter;

  constructor(app: ShardixApplication, mockAdapter: MockDiscordAdapter) {
    this.app = app;
    this.mockAdapter = mockAdapter;
    this.executeInteraction = this.executeInteraction.bind(this);
    this.emitEvent = this.emitEvent.bind(this);
  }

  public async executeInteraction(payload: InteractionPayload): Promise<any> {
    return await this.app.getRouter().handleInteraction(payload);
  }

  public async emitEvent(eventName: string, ...args: any[]): Promise<void> {
    await this.app.getRouter().handleEvent(eventName, ...args);
    await this.mockAdapter.emitEvent(eventName, ...args);
  }
}

export async function createTestingApplication(options: TestingApplicationOptions = {}): Promise<TestingApplication> {
  const mockAdapter = new MockDiscordAdapter();
  const app = await ShardixFactory.create({
    adapter: mockAdapter,
    autoAnalyze: false,
  });

  if (options.controllers) {
    AutoScanner.scanAndRegister(app, options.controllers);
  }

  if (options.modules) {
    for (const mod of options.modules) {
      app.register(mod);
    }
  }

  await app.start();
  return new TestingApplication(app, mockAdapter);
}

export function mockInteraction(options: {
  command?: string;
  customId?: string;
  type?: number;
  userId?: string;
  guildId?: string;
  data?: any;
}): InteractionPayload {
  return {
    id: `mock_int_${Date.now()}`,
    token: `mock_token_${Date.now()}`,
    type: options.type || (options.customId ? 3 : 2),
    data: options.data || {
      name: options.command,
      custom_id: options.customId,
    },
    guild_id: 'guildId' in options ? (options.guildId as string) : 'mock_guild_123',
    user: { id: options.userId || 'mock_user_456', username: 'TestUser' },
    member: { user: { id: options.userId || 'mock_user_456', username: 'TestUser' }, roles: [] },
  };
}
