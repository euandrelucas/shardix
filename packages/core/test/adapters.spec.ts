import { describe, it, expect } from 'vitest';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { ErisAdapter } from '@shardix/eris';
import { OceanicAdapter } from '@shardix/oceanicjs';
import { DiscordenoAdapter } from '@shardix/discordeno';

describe('Multi-Vendor Discord Adapters (v0.4)', () => {
  it('DiscordJSAdapter should implement DiscordAdapter interface', async () => {
    const adapter = new DiscordJSAdapter();
    expect(adapter.name).toBe('DiscordJSAdapter');
  });

  it('ErisAdapter should implement DiscordAdapter interface', async () => {
    const adapter = new ErisAdapter();
    expect(adapter.name).toBe('ErisAdapter');
    await adapter.login('test_token');
    expect(adapter.getStatus()).toBe(true);
    await adapter.destroy();
    expect(adapter.getStatus()).toBe(false);
  });

  it('OceanicAdapter should implement DiscordAdapter interface', async () => {
    const adapter = new OceanicAdapter();
    expect(adapter.name).toBe('OceanicAdapter');
    await adapter.login('test_token');
    expect(adapter.getStatus()).toBe(true);
    await adapter.destroy();
    expect(adapter.getStatus()).toBe(false);
  });

  it('DiscordenoAdapter should implement DiscordAdapter interface', async () => {
    const adapter = new DiscordenoAdapter();
    expect(adapter.name).toBe('DiscordenoAdapter');
    await adapter.login('test_token');
    expect(adapter.getStatus()).toBe(true);
    await adapter.destroy();
    expect(adapter.getStatus()).toBe(false);
  });

  it('DiscordJSAdapter should register and dispatch @Event native listeners', async () => {
    const adapter = new DiscordJSAdapter();
    let receivedMember: any = null;

    adapter.onEvent('guildMemberAdd', (member: any) => {
      receivedMember = member;
    });

    const mockClient = adapter.getClient();
    if (mockClient && mockClient.emit) {
      mockClient.emit('guildMemberAdd', { user: { username: 'testuser' } });
      expect(receivedMember?.user?.username).toBe('testuser');
    }
  });
});
