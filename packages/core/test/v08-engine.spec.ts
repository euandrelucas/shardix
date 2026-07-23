import { describe, it, expect } from 'vitest';
import {
  ActionRowBuilder,
  SlashCommandBuilder,
  ContextMenuBuilder,
  ThreadBuilder,
  RoleBuilder,
  PermissionBuilder,
} from '@shardix/common';
import { PresenceManager } from '../src/presence/presence-manager.js';
import { RateLimitManager } from '../src/ratelimit/rate-limit-manager.js';
import { MiddlewarePipeline } from '../src/middleware/middleware-pipeline.js';

describe('Shardix v0.8 — Platform Engine & Advanced Builders', () => {
  it('Advanced Builders should generate valid Discord API JSON structures', () => {
    const slash = new SlashCommandBuilder().setName('kick').setDescription('Kick member').toJSON();
    expect(slash.name).toBe('kick');

    const actionRow = new ActionRowBuilder().toJSON();
    expect(actionRow.type).toBe(1);

    const contextMenu = new ContextMenuBuilder().setName('User Info').setType(2).toJSON();
    expect(contextMenu.type).toBe(2);

    const thread = new ThreadBuilder().setName('Discussion').setAutoArchiveDuration(60).toJSON();
    expect(thread.name).toBe('Discussion');

    const role = new RoleBuilder().setName('Admin').setColor(0xff0000).setHoist(true).toJSON();
    expect(role.name).toBe('Admin');
    expect(role.hoist).toBe(true);

    const perm = new PermissionBuilder().add(8n).toString(); // Administrator (8)
    expect(perm).toBe('8');
  });

  it('PresenceManager should set and retrieve presence state', () => {
    const presence = new PresenceManager();
    presence.set({ status: 'dnd', activities: [{ name: 'Shardix Bot', type: 0 }] });

    const current = presence.getPresence();
    expect(current.status).toBe('dnd');
    expect(current.activities?.[0].name).toBe('Shardix Bot');
  });

  it('RateLimitManager should track buckets and enforce rate limits', () => {
    const rlm = new RateLimitManager();
    const res1 = rlm.check('guild_1', 2, 60000);
    expect(res1.allowed).toBe(true);

    const res2 = rlm.check('guild_1', 2, 60000);
    expect(res2.allowed).toBe(true);

    const res3 = rlm.check('guild_1', 2, 60000);
    expect(res3.allowed).toBe(false);
    expect(res3.retryAfter).toBeGreaterThan(0);
  });

  it('MiddlewarePipeline should execute middlewares in sequential order', async () => {
    const pipeline = new MiddlewarePipeline();
    const order: number[] = [];

    pipeline.use(async (req, res, next) => {
      order.push(1);
      const val = await next();
      order.push(3);
      return val;
    });

    const res = await pipeline.execute({}, {}, async () => {
      order.push(2);
      return 'done';
    });

    expect(res).toBe('done');
    expect(order).toEqual([1, 2, 3]);
  });
});
