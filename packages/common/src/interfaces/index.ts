export type Type<T = any> = new (...args: any[]) => T;
export type InjectionToken = string | symbol | Type<any>;

export enum Scope {
  SINGLETON = 'SINGLETON',
  SCOPED = 'SCOPED',
  TRANSIENT = 'TRANSIENT',
}

export interface InjectableOptions {
  scope?: Scope;
}

export interface ClassProvider<T = any> {
  provide: InjectionToken;
  useClass: Type<T>;
  scope?: Scope;
}

export interface ValueProvider<T = any> {
  provide: InjectionToken;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: InjectionToken;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: InjectionToken[];
  scope?: Scope;
}

export type Provider<T = any> = Type<T> | ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

export interface DynamicModule {
  module: Type<any>;
  imports?: (Type<any> | DynamicModule)[];
  providers?: Provider[];
  controllers?: Type<any>[];
  exports?: (InjectionToken | Provider | DynamicModule)[];
}

export interface ModuleMetadata {
  imports?: (Type<any> | DynamicModule)[];
  providers?: Provider[];
  controllers?: Type<any>[];
  exports?: (InjectionToken | Provider | DynamicModule)[];
}

export interface OnModuleInit {
  onModuleInit(): void | Promise<void>;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): void | Promise<void>;
}

export interface OnModuleDestroy {
  onModuleDestroy(): void | Promise<void>;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): void | Promise<void>;
}

export interface ProviderContract {
  readonly name: string;
  readonly version: string;
  register(app: any): Promise<void> | void;
  boot?(): Promise<void> | void;
  shutdown?(): Promise<void> | void;
}

export interface Runtime {
  readonly name: string;
  start(app: any): Promise<void>;
  stop(): Promise<void>;
}

export interface RawDiscordEvent {
  t: string;
  d: any;
  op?: number;
  s?: number;
}

export interface DiscordAdapter<TClient = any> {
  readonly name: string;
  getClient(): TClient;
  login(token: string): Promise<void>;
  destroy(): Promise<void>;
  registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void;
  emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void>;
  onEvent?(eventName: string, handler: (...args: any[]) => void | Promise<void>): void;
}

export interface InteractionPayload {
  id: string;
  token: string;
  type: number;
  data?: any;
  guild_id?: string;
  channel_id?: string;
  member?: any;
  user?: any;
  [key: string]: any;
}

export type InteractionHandler = (payload: InteractionPayload) => Promise<any>;

export interface Transport {
  readonly name: string;
  listen(handler: InteractionHandler): Promise<void>;
  close(): Promise<void>;
}

export interface ExecutionContext {
  getType(): 'gateway' | 'http' | 'custom';
  getPayload<T = any>(): T;
  getAdapter<T = DiscordAdapter>(): T;
  getArg<T = any>(index: number): T;
}

export interface Guard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface Pipe<T = any, R = any> {
  transform(value: T, context: ExecutionContext): R | Promise<R>;
}

export interface Interceptor {
  intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any>;
}

export interface Middleware {
  use(context: ExecutionContext, next: () => Promise<void>): void | Promise<void>;
}
