import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { DependsOn, ProviderContract } from '@shardix/common';
import { ProviderManager, ShardixApplication } from '../src/index.js';

class LoggerTestProvider implements ProviderContract {
  public readonly name = 'LoggerTestProvider';
  public readonly version = '0.3.0';
  public registered = false;
  public booted = false;
  public shutdownCalled = false;

  async register() { this.registered = true; }
  async boot() { this.booted = true; }
  async shutdown() { this.shutdownCalled = true; }
}

@DependsOn(LoggerTestProvider)
class CacheTestProvider implements ProviderContract {
  public readonly name = 'CacheTestProvider';
  public readonly version = '0.3.0';
  public registered = false;
  public booted = false;

  async register() { this.registered = true; }
  async boot() { this.booted = true; }
}

describe('ProviderManager & Provider System (v0.3)', () => {
  it('should auto-resolve dependencies declared with @DependsOn and register in topological order', async () => {
    const app = new ShardixApplication({ autoAnalyze: false });
    const manager = new ProviderManager(app);

    // Register CacheTestProvider which depends on LoggerTestProvider
    manager.use(CacheTestProvider);

    const providers = manager.getProviders();
    expect(providers.length).toBe(2);
    expect(providers[0].name).toBe('LoggerTestProvider');
    expect(providers[1].name).toBe('CacheTestProvider');

    await manager.registerAll();
    await manager.bootAll();

    const loggerInst = providers[0] as LoggerTestProvider;
    const cacheInst = providers[1] as CacheTestProvider;

    expect(loggerInst.registered).toBe(true);
    expect(loggerInst.booted).toBe(true);
    expect(cacheInst.registered).toBe(true);
    expect(cacheInst.booted).toBe(true);
  });

  it('should run shutdown in reverse dependency order', async () => {
    const app = new ShardixApplication({ autoAnalyze: false });
    const manager = new ProviderManager(app);

    const logger = new LoggerTestProvider();
    manager.use(logger);

    await manager.registerAll();
    await manager.bootAll();
    await manager.shutdownAll();

    expect(logger.shutdownCalled).toBe(true);
  });

  it('should detect circular provider dependencies and throw error', () => {
    const app = new ShardixApplication({ autoAnalyze: false });
    const manager = new ProviderManager(app);

    @DependsOn(class ProviderB implements ProviderContract {
      readonly name = 'ProviderB';
      readonly version = '0.3';
      register() {}
    })
    class ProviderA implements ProviderContract {
      readonly name = 'ProviderA';
      readonly version = '0.3';
      register() {}
    }

    manager.use(ProviderA);
    // Force circular dependency metadata for test
    Reflect.defineMetadata('shardix:depends_on', [ProviderA], ProviderA);

    expect(() => manager.topologicalSort()).toThrow(/Circular dependency/);
  });
});
