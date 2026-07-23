import 'reflect-metadata';
import {
  DiscordAdapter,
  METADATA_KEYS,
  ModuleMetadata,
  OnApplicationShutdown,
  ProviderContract,
  Runtime,
  Transport,
  Type,
} from '@shardix/common';
import { Container } from '../di/container.js';
import { InteractionRouter } from '../router/interaction-router.js';
import { ProjectAnalyzer } from '../analyzer/project-analyzer.js';
import { ProviderManager } from '../providers/provider-manager.js';

export interface ShardixOptions {
  adapter?: DiscordAdapter;
  runtime?: Runtime | Type<Runtime>;
  transport?: Transport | Type<Transport>;
  transports?: (Transport | Type<Transport>)[];
  providers?: (ProviderContract | Type<ProviderContract>)[];
  autoAnalyze?: boolean;
}

export class ShardixApplication {
  private container = new Container();
  private router = new InteractionRouter(this.container);
  private providerManager = new ProviderManager(this);
  private initializedModules = new Set<Type<any>>();
  private moduleInstances: any[] = [];
  private registeredControllers: Type<any>[] = [];
  private transports: Transport[] = [];
  private runtime?: Runtime;
  private adapter?: DiscordAdapter;
  private autoAnalyze: boolean;

  constructor(options: ShardixOptions = {}) {
    this.adapter = options.adapter;
    this.autoAnalyze = options.autoAnalyze !== false;

    if (options.providers) {
      for (const p of options.providers) {
        this.providerManager.use(p);
      }
    }

    if (options.runtime) {
      if (typeof options.runtime === 'function') {
        this.runtime = new (options.runtime as Type<Runtime>)();
      } else {
        this.runtime = options.runtime;
      }
    }

    const rawTransports = options.transports || (options.transport ? [options.transport] : []);
    for (const t of rawTransports) {
      if (typeof t === 'function') {
        this.transports.push(new (t as Type<Transport>)());
      } else {
        this.transports.push(t);
      }
    }
  }

  public use(provider: ProviderContract | Type<ProviderContract>): this {
    this.providerManager.use(provider);
    return this;
  }

  public usePlugin(plugin: any): this {
    if (typeof plugin.register === 'function') {
      plugin.register(this);
    }
    return this;
  }

  public register(rootModule: Type<any>): void {
    this.loadModule(rootModule);
  }

  public async start(): Promise<void> {
    if (this.autoAnalyze) {
      const analysis = ProjectAnalyzer.analyze(this.registeredControllers);
      if (process.env.NODE_ENV !== 'test') {
        console.log(analysis.suggestionMessage);
      }
    }

    // Providers: Register & Boot
    await this.providerManager.registerAll();
    await this.providerManager.bootAll();

    // Lifecycle: OnModuleInit
    for (const instance of this.moduleInstances) {
      if (typeof instance.onModuleInit === 'function') {
        await instance.onModuleInit();
      }
    }

    // Lifecycle: OnApplicationBootstrap
    for (const instance of this.moduleInstances) {
      if (typeof instance.onApplicationBootstrap === 'function') {
        await instance.onApplicationBootstrap();
      }
    }

    // Start via Runtime if provided
    if (this.runtime) {
      await this.runtime.start(this);
    } else {
      for (const transport of this.transports) {
        await transport.listen((payload) => this.router.handleInteraction(payload));
      }
    }
  }

  public async stop(signal?: string): Promise<void> {
    if (this.runtime) {
      await this.runtime.stop();
    } else {
      for (const transport of this.transports) {
        await transport.close();
      }
    }

    // Providers Shutdown
    await this.providerManager.shutdownAll();

    for (const instance of this.moduleInstances) {
      if (typeof instance.onModuleDestroy === 'function') {
        await instance.onModuleDestroy();
      }
      if (typeof instance.onApplicationShutdown === 'function') {
        await (instance as OnApplicationShutdown).onApplicationShutdown(signal);
      }
    }

    if (this.adapter) {
      await this.adapter.destroy();
    }
  }

  public getContainer(): Container {
    return this.container;
  }

  public getRouter(): InteractionRouter {
    return this.router;
  }

  private loadModule(moduleClass: Type<any>): void {
    if (this.initializedModules.has(moduleClass)) {
      return;
    }
    this.initializedModules.add(moduleClass);

    const metadata: ModuleMetadata = Reflect.getMetadata(METADATA_KEYS.MODULE, moduleClass);
    if (!metadata) {
      throw new Error(`[Shardix Core] Class ${moduleClass.name} is not decorated with @Module()`);
    }

    // Process Imports
    if (metadata.imports) {
      for (const imported of metadata.imports) {
        if ('module' in imported) {
          this.loadModule(imported.module);
        } else {
          this.loadModule(imported);
        }
      }
    }

    // Register Providers
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        this.container.register(provider);
      }
    }

    // Register Controllers
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.container.register(controller);
        this.router.registerController(controller);
        this.registeredControllers.push(controller);

        if (this.adapter && typeof this.adapter.onEvent === 'function') {
          const events: any[] = Reflect.getMetadata(METADATA_KEYS.EVENT, controller) || [];
          for (const item of events) {
            this.adapter.onEvent(item.eventName, (...args: any[]) =>
              this.router.handleEvent(item.eventName, ...args)
            );
          }
        }
      }
    }

    // Instantiate Module
    const moduleInstance = this.container.get(moduleClass);
    this.moduleInstances.push(moduleInstance);
  }

  public getAdapter(): DiscordAdapter | undefined {
    return this.adapter;
  }
}
