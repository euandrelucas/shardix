import 'reflect-metadata';
import {
  DiscordAdapter,
  METADATA_KEYS,
  ModuleMetadata,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
  Transport,
  Type,
} from '@shardix/common';
import { Container } from '../di/container.js';
import { InteractionRouter } from '../router/interaction-router.js';

export interface ShardixOptions {
  adapter?: DiscordAdapter;
  transport?: Transport | Type<Transport>;
  transports?: (Transport | Type<Transport>)[];
}

export class ShardixApplication {
  private container = new Container();
  private router = new InteractionRouter(this.container);
  private initializedModules = new Set<Type<any>>();
  private moduleInstances: any[] = [];
  private transports: Transport[] = [];
  private adapter?: DiscordAdapter;

  constructor(options: ShardixOptions = {}) {
    this.adapter = options.adapter;

    const rawTransports = options.transports || (options.transport ? [options.transport] : []);
    for (const t of rawTransports) {
      if (typeof t === 'function') {
        this.transports.push(new (t as Type<Transport>)());
      } else {
        this.transports.push(t);
      }
    }
  }

  public register(rootModule: Type<any>): void {
    this.loadModule(rootModule);
  }

  public async start(): Promise<void> {
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

    // Start Transports
    for (const transport of this.transports) {
      await transport.listen((payload) => this.router.handleInteraction(payload));
    }
  }

  public async stop(): Promise<void> {
    for (const transport of this.transports) {
      await transport.close();
    }

    for (const instance of this.moduleInstances) {
      if (typeof instance.onModuleDestroy === 'function') {
        await instance.onModuleDestroy();
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
      }
    }

    // Instantiate Module
    const moduleInstance = this.container.get(moduleClass);
    this.moduleInstances.push(moduleInstance);
  }
}
