import 'reflect-metadata';
import { METADATA_KEYS, ProviderContract, Type } from '@shardix/common';
import type { ShardixApplication } from '../application/shardix-application.js';

export class ProviderManager {
  private providers = new Map<string, ProviderContract>();
  private providerClasses = new Map<Type<ProviderContract>, ProviderContract>();
  private providerInstances: ProviderContract[] = [];

  constructor(private app: ShardixApplication) {}

  public use(providerOrClass: ProviderContract | Type<ProviderContract>): this {
    let instance: ProviderContract;
    let targetClass: Type<ProviderContract>;

    if (typeof providerOrClass === 'function') {
      targetClass = providerOrClass as Type<ProviderContract>;
      if (this.providerClasses.has(targetClass)) {
        return this;
      }
      instance = new targetClass();
    } else {
      instance = providerOrClass;
      targetClass = instance.constructor as Type<ProviderContract>;
      if (this.providers.has(instance.name)) {
        return this;
      }
    }

    this.providers.set(instance.name, instance);
    this.providerClasses.set(targetClass, instance);
    this.providerInstances.push(instance);

    // Resolve Dependencies via @DependsOn
    const dependencies: Type<ProviderContract>[] =
      Reflect.getMetadata(METADATA_KEYS.DEPENDS_ON, targetClass) || [];
    for (const DepClass of dependencies) {
      if (!this.providerClasses.has(DepClass)) {
        this.use(DepClass);
      }
    }

    return this;
  }

  public async registerAll(): Promise<void> {
    const sorted = this.topologicalSort();
    for (const provider of sorted) {
      await provider.register(this.app);
    }
  }

  public async bootAll(): Promise<void> {
    const sorted = this.topologicalSort();
    for (const provider of sorted) {
      if (typeof provider.boot === 'function') {
        await provider.boot();
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    const sorted = this.topologicalSort().slice().reverse();
    for (const provider of sorted) {
      if (typeof provider.shutdown === 'function') {
        await provider.shutdown();
      }
    }
  }

  public getProviders(): ProviderContract[] {
    return this.topologicalSort();
  }

  public topologicalSort(): ProviderContract[] {
    const sorted: ProviderContract[] = [];
    const visited = new Set<ProviderContract>();
    const visiting = new Set<ProviderContract>();

    const visit = (provider: ProviderContract) => {
      if (visiting.has(provider)) {
        throw new Error(`[Shardix ProviderManager] Circular dependency detected in Provider: ${provider.name}`);
      }

      if (!visited.has(provider)) {
        visiting.add(provider);

        const targetClass = provider.constructor as Type<ProviderContract>;
        const dependencies: Type<ProviderContract>[] =
          Reflect.getMetadata(METADATA_KEYS.DEPENDS_ON, targetClass) || [];

        for (const DepClass of dependencies) {
          const depInstance = this.providerClasses.get(DepClass);
          if (depInstance) {
            visit(depInstance);
          }
        }

        visiting.delete(provider);
        visited.add(provider);
        sorted.push(provider);
      }
    };

    for (const provider of this.providerInstances) {
      visit(provider);
    }

    return sorted;
  }
}
