import 'reflect-metadata';
import {
  ClassProvider,
  FactoryProvider,
  InjectableOptions,
  InjectionToken,
  METADATA_KEYS,
  Provider,
  Scope,
  Type,
  ValueProvider,
} from '@shardix/common';

export interface ScopeContext {
  id: string;
  instances: Map<InjectionToken, any>;
}

export class Container {
  private providers = new Map<InjectionToken, Provider>();
  private singletons = new Map<InjectionToken, any>();
  private buildingTokens = new Set<InjectionToken>();

  public register(provider: Provider): void {
    const token = this.getToken(provider);
    this.providers.set(token, provider);
  }

  public get<T = any>(token: InjectionToken, context?: ScopeContext): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    if (context && context.instances.has(token)) {
      return context.instances.get(token);
    }

    const provider = this.providers.get(token);
    if (!provider) {
      if (typeof token === 'function') {
        return this.resolveClass(token as Type<any>, Scope.SINGLETON, context);
      }
      throw new Error(`[Shardix DI] No provider registered for token: ${String(token)}`);
    }

    return this.resolveProvider(token, provider, context);
  }

  public createScope(id?: string): ScopeContext {
    return {
      id: id || Math.random().toString(36).substring(2, 9),
      instances: new Map(),
    };
  }

  private getToken(provider: Provider): InjectionToken {
    if (typeof provider === 'function') {
      return provider;
    }
    return provider.provide;
  }

  private resolveProvider(token: InjectionToken, provider: Provider, context?: ScopeContext): any {
    if ('useValue' in provider) {
      this.singletons.set(token, (provider as ValueProvider).useValue);
      return (provider as ValueProvider).useValue;
    }

    if ('useFactory' in provider) {
      const factoryProvider = provider as FactoryProvider;
      const scope = factoryProvider.scope || Scope.SINGLETON;
      const deps = (factoryProvider.inject || []).map((depToken) => this.get(depToken, context));
      const instance = factoryProvider.useFactory(...deps);

      if (scope === Scope.SINGLETON) {
        this.singletons.set(token, instance);
      } else if (scope === Scope.SCOPED && context) {
        context.instances.set(token, instance);
      }
      return instance;
    }

    if ('useClass' in provider) {
      const classProvider = provider as ClassProvider;
      const scope = classProvider.scope || Scope.SINGLETON;
      return this.resolveClass(classProvider.useClass, scope, context, token);
    }

    if (typeof provider === 'function') {
      return this.resolveClass(provider, Scope.SINGLETON, context, token);
    }

    throw new Error(`[Shardix DI] Invalid provider configuration for token: ${String(token)}`);
  }

  private resolveClass(
    target: Type<any>,
    defaultScope: Scope,
    context?: ScopeContext,
    tokenOverride?: InjectionToken
  ): any {
    const token = tokenOverride || target;

    if (this.buildingTokens.has(token)) {
      throw new Error(`[Shardix DI] Circular dependency detected for token: ${String(token)}`);
    }

    this.buildingTokens.add(token);

    try {
      const options: InjectableOptions = Reflect.getMetadata(METADATA_KEYS.INJECTABLE, target) || {};
      const scope = options.scope || defaultScope;

      const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || [];
      const paramInjects: Map<number, InjectionToken> =
        Reflect.getOwnMetadata(METADATA_KEYS.PARAM_INJECT, target, '') || new Map();

      const args = paramTypes.map((paramType, index) => {
        const customToken = paramInjects.get(index);
        const depToken = customToken || paramType;
        return this.get(depToken, context);
      });

      const instance = new target(...args);

      if (scope === Scope.SINGLETON) {
        this.singletons.set(token, instance);
      } else if (scope === Scope.SCOPED && context) {
        context.instances.set(token, instance);
      }

      return instance;
    } finally {
      this.buildingTokens.delete(token);
    }
  }
}
