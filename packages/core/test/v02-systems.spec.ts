import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import {
  Controller,
  Event,
  Injectable,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
  SlashCommand,
} from '@shardix/common';
import {
  AutoScanner,
  HttpRuntime,
  ProjectAnalyzer,
  ReflectionContainer,
  ShardixApplication,
} from '../src/index.js';

@Injectable()
class TestService {
  public initialized = false;
  public bootstrapped = false;
  public destroyed = false;
  public shutdown = false;
}

@Controller()
class TestController {
  @SlashCommand({ name: 'test', description: 'test command' })
  onTestCommand() {
    return { type: 4, data: { content: 'ok' } };
  }

  @Event('ready')
  onReady() {}
}

@Module({
  controllers: [TestController],
  providers: [TestService],
})
class TestModule
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown
{
  constructor(public service: TestService) {}

  onModuleInit() {
    this.service.initialized = true;
  }

  onApplicationBootstrap() {
    this.service.bootstrapped = true;
  }

  onModuleDestroy() {
    this.service.destroyed = true;
  }

  onApplicationShutdown(signal?: string) {
    this.service.shutdown = true;
  }
}

describe('Shardix v0.2 Systems', () => {
  it('ReflectionContainer should cache metadata and reflect only once per class', () => {
    ReflectionContainer.clearCache();

    const meta1 = ReflectionContainer.reflect(TestController);
    const meta2 = ReflectionContainer.reflect(TestController);

    expect(meta1).toBe(meta2);
    expect(meta1.isController).toBe(true);
    expect(meta1.slashCommands.length).toBe(1);
    expect(ReflectionContainer.getReflectionCount(TestController)).toBe(1);
  });

  it('ProjectAnalyzer should recommend HybridRuntime when Gateway events and interactions coexist', () => {
    const result = ProjectAnalyzer.analyze([TestController]);
    expect(result.recommendedRuntime).toBe('HybridRuntime');
    expect(result.gatewayEventsCount).toBe(1);
    expect(result.interactionHandlersCount).toBe(1);
  });

  it('ProjectAnalyzer should recommend HttpRuntime when only interactions are present', () => {
    @Controller()
    class HttpOnlyController {
      @SlashCommand({ name: 'ping', description: 'ping' })
      ping() {}
    }

    const result = ProjectAnalyzer.analyze([HttpOnlyController]);
    expect(result.recommendedRuntime).toBe('HttpRuntime');
    expect(result.suggestionMessage).toContain('HttpRuntime is recommended');
  });

  it('Lifecycle Hooks should trigger in correct sequence', async () => {
    const app = new ShardixApplication({ autoAnalyze: false });
    app.register(TestModule);

    const service = app.getContainer().get(TestService);
    expect(service.initialized).toBe(false);
    expect(service.bootstrapped).toBe(false);

    await app.start();

    expect(service.initialized).toBe(true);
    expect(service.bootstrapped).toBe(true);

    await app.stop('SIGTERM');

    expect(service.destroyed).toBe(true);
    expect(service.shutdown).toBe(true);
  });

  it('AutoScanner should register modules, controllers, and injectables without manual boilerplate', () => {
    const app = new ShardixApplication({ autoAnalyze: false });

    AutoScanner.scanAndRegister(app, [TestModule, TestController, TestService]);

    const service = app.getContainer().get(TestService);
    expect(service).toBeInstanceOf(TestService);
  });
});
