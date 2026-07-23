import { describe, it, expect } from 'vitest';
import { ShardixError, ConfigurationError, ProviderError, RateLimit } from '@shardix/common';
import { PluginManager, ShardixPlugin } from '@shardix/plugin';
import { createTestingApplication, mockInteraction } from '@shardix/testing';
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
class RateLimitedController {
  @SlashCommand({ name: 'limited', description: 'Limited command' })
  @RateLimit({ limit: 1, window: 60000, message: 'Too many requests!' })
  async limitedCmd() {
    return { type: 4, data: { content: 'Success!' } };
  }
}

class TestPlugin implements ShardixPlugin {
  public readonly name = 'TestPlugin';
  public readonly version = '1.0.0';
  public registered = false;

  register(app: any) {
    this.registered = true;
  }
}

describe('Shardix v0.6 Systems & Foundations', () => {
  it('Structured Errors should contain code, solution, and docs link', () => {
    const err = new ConfigurationError('Invalid token', 'Set DISCORD_TOKEN in .env');
    expect(err.code).toBe('ERR_SHARDIX_CONFIG');
    expect(err.solution).toBe('Set DISCORD_TOKEN in .env');
    expect(err.docsUrl).toBeDefined();

    const provErr = new ProviderError('CacheProvider', 'Redis host missing');
    expect(provErr.code).toBe('ERR_SHARDIX_PROVIDER');
  });

  it('PluginManager should register and initialize plugins cleanly', async () => {
    const pluginManager = new PluginManager();
    const plugin = new TestPlugin();
    pluginManager.register(plugin);

    expect(pluginManager.hasPlugin('TestPlugin')).toBe(true);
    await pluginManager.initAll({});
    expect(plugin.registered).toBe(true);
  });

  it('@shardix/testing should execute isolated interactions without network', async () => {
    const { executeInteraction, app } = await createTestingApplication({
      controllers: [RateLimitedController],
    });

    const payload = mockInteraction({ command: 'limited', userId: 'user_1' });
    const res1 = await executeInteraction(payload);
    expect(res1.data.content).toBe('Success!');

    // Second call exceeds rate limit (limit: 1)
    const res2 = await executeInteraction(payload);
    expect(res2.data.content).toBe('Too many requests!');

    await app.stop();
  });
});
