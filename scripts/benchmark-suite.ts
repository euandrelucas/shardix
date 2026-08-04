/**
 * @file benchmark-suite.ts
 * @description Shardix Multi-Adapter Performance Benchmark Suite
 *
 * Simulates a realistic bot lifecycle per library:
 *   1. Instantiate client / bot
 *   2. Register all command handlers (like a real bot)
 *   3. Simulate IDENTIFY → READY → GUILD_CREATE gateway sequence
 *   4. Warm up with 1,000 interactions
 *   5. Measure 100,000 sequential dispatches → p50/p95/p99 latency
 *   6. Measure 100 concurrent interactions → concurrent throughput
 *   7. Teardown / destroy / disconnect
 *
 * Run:
 *   npx tsx scripts/benchmark-suite.ts
 *   npx tsx scripts/benchmark-suite.ts --save
 *   npx tsx scripts/benchmark-suite.ts --json
 */

import '../packages/common/node_modules/reflect-metadata/Reflect.js';
import { performance } from 'node:perf_hooks';
import { ShardixFactory, AutoScanner } from '../packages/core/src/index.js';
import { DiscordJSAdapter } from '../packages/discordjs/src/index.js';
import { ErisAdapter } from '../packages/eris/src/index.js';
import { OceanicAdapter } from '../packages/oceanicjs/src/index.js';
import { DiscordenoAdapter } from '../packages/discordeno/src/index.js';
import { MockDiscordAdapter, mockInteraction } from '../packages/testing/src/index.js';
import { Controller, SlashCommand, Injectable, Scope, Inject } from '../packages/common/src/index.js';
import type { CommandContext } from '../packages/common/src/index.js';

// Real library imports
import { Client as DiscordJSClient, GatewayIntentBits } from 'discord.js';
import ErisClient from 'eris';
import { Client as OceanicClient } from 'oceanic.js';
import { createBot as createDiscordenoBot } from '@discordeno/bot';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Compute percentiles from a sorted array of numbers */
function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, idx)].toFixed(2));
}

/** Collect N timing samples and return sorted array */
async function collectSamples(
  fn: () => Promise<void> | void,
  n: number
): Promise<number[]> {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    await fn();
    samples.push(performance.now() - t);
  }
  samples.sort((a, b) => a - b);
  return samples;
}

/** Simulate a Discord Gateway IDENTIFY → READY → GUILD_CREATE handshake (mock) */
function simulateGatewayHandshake(emitter: { emit: Function }, library: string): void {
  // Each library uses different event names / payload shapes — we simulate the essentials
  if (library === 'discordjs') {
    // Discord.js emits 'ready' with a partial client user
    emitter.emit('ready', { user: { id: '987654321098765432', tag: 'BenchBot#0001' } });
    emitter.emit('guildCreate', {
      id: '111222333444555666',
      name: 'Benchmark Guild',
      memberCount: 10000,
    });
  } else if (library === 'eris') {
    emitter.emit('ready');
    emitter.emit('guildCreate', { id: '111222333444555666', name: 'Benchmark Guild' });
  } else if (library === 'oceanic') {
    emitter.emit('ready');
    emitter.emit('guildCreate', { id: '111222333444555666', name: 'Benchmark Guild' });
  }
}

// ─── Benchmark Result Interface ──────────────────────────────────────────────

export interface MetricResult {
  name: string;
  /** Library used as underlying transport */
  library: 'shardix' | 'discord.js' | 'eris' | 'oceanic.js' | 'discordeno';
  /** Whether this is a raw baseline or a Shardix-wrapped measurement */
  type: 'raw' | 'shardix';
  /** Time from construction to first-ready in ms */
  bootstrapMs: number;
  /** Time to gracefully shut down in ms */
  shutdownMs: number;
  /** Heap used delta in MB (process.memoryUsage().heapUsed) */
  memoryHeapMB: number;
  /** Resident Set Size in MB */
  memoryRssMB: number;
  /** Sequential throughput: ops per second */
  opsPerSec: number;
  /** Average latency of sequential dispatches in µs */
  avgLatencyUs: number;
  /** 50th percentile latency in µs */
  p50LatencyUs: number;
  /** 95th percentile latency in µs */
  p95LatencyUs: number;
  /** 99th percentile latency in µs */
  p99LatencyUs: number;
  /** Throughput under concurrent load (100 concurrent dispatches) */
  concurrentOpsPerSec: number;
}

// ─── Benchmark Controller & Service ─────────────────────────────────────────

@Injectable({ scope: Scope.SINGLETON })
class BenchmarkService {
  public compute(val: number): number {
    return val * 42;
  }

  public buildHeavyPayload(count: number): Record<string, string>[] {
    return Array.from({ length: count }, (_, i) => ({ name: `Field ${i}`, value: `Val ${i}` }));
  }
}

@Controller()
class BenchmarkController {
  constructor(@Inject(BenchmarkService) private service: BenchmarkService) {}

  @SlashCommand({ name: 'ping', description: 'Benchmark ping command' })
  public async ping(ctx: CommandContext) {
    const res = this.service.compute(10);
    return ctx.reply({ content: `Pong! Result: ${res}` });
  }

  @SlashCommand({ name: 'heavy', description: 'Benchmark heavy payload command' })
  public async heavy(ctx: CommandContext) {
    const fields = this.service.buildHeavyPayload(50);
    return ctx.reply({ content: 'Heavy response', embeds: [{ title: 'Heavy', fields }] });
  }

  @SlashCommand({ name: 'echo', description: 'Benchmark echo command' })
  public async echo(ctx: CommandContext) {
    return ctx.reply({ content: `Echo: ${ctx.interaction.data?.name ?? 'unknown'}` });
  }
}

// ─── Shardix Adapter Benchmark ───────────────────────────────────────────────

async function benchmarkShardixWithAdapter(
  name: string,
  library: MetricResult['library'],
  adapterInstance: any
): Promise<MetricResult> {
  if (global.gc) global.gc();

  const startMem = process.memoryUsage();
  const startBoot = performance.now();

  const app = await ShardixFactory.create({
    adapter: adapterInstance,
    autoAnalyze: false,
  });

  AutoScanner.scanAndRegister(app, [BenchmarkService, BenchmarkController]);
  await app.start();

  const bootTime = performance.now() - startBoot;
  const router = app.getRouter();

  // Warmup
  const warmupPayload = mockInteraction({ command: 'ping' });
  for (let i = 0; i < 1000; i++) {
    await router.handleInteraction(warmupPayload);
  }

  // Sequential samples (100,000 iterations)
  const SEQUENTIAL = 100_000;
  const seqPayload = mockInteraction({ command: 'ping' });
  const startSeq = performance.now();
  const samples = await collectSamples(() => router.handleInteraction(seqPayload), SEQUENTIAL);
  const totalSeqMs = performance.now() - startSeq;

  // Concurrent load (100 concurrent interactions × 100 rounds = 10,000 total)
  const CONCURRENT_BATCH = 100;
  const CONCURRENT_ROUNDS = 100;
  const concPayload = mockInteraction({ command: 'ping' });
  const startConc = performance.now();
  for (let r = 0; r < CONCURRENT_ROUNDS; r++) {
    await Promise.all(
      Array.from({ length: CONCURRENT_BATCH }, () => router.handleInteraction(concPayload))
    );
  }
  const totalConcMs = performance.now() - startConc;

  const endMem = process.memoryUsage();

  const startShutdown = performance.now();
  await app.stop();
  const shutdownMs = Number((performance.now() - startShutdown).toFixed(2));

  // Compute metrics
  const opsPerSec = Math.round((SEQUENTIAL / totalSeqMs) * 1000);
  const avgLatencyUs = Number(((totalSeqMs / SEQUENTIAL) * 1000).toFixed(2));
  const samplesUs = samples.map((s) => s * 1000); // ms → µs
  const p50LatencyUs = percentile(samplesUs, 50);
  const p95LatencyUs = percentile(samplesUs, 95);
  const p99LatencyUs = percentile(samplesUs, 99);
  const concurrentOpsPerSec = Math.round(((CONCURRENT_BATCH * CONCURRENT_ROUNDS) / totalConcMs) * 1000);
  const memoryHeapMB = Number(((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2));
  const memoryRssMB = Number((endMem.rss / 1024 / 1024).toFixed(2));

  return {
    name,
    library,
    type: 'shardix',
    bootstrapMs: Number(bootTime.toFixed(2)),
    shutdownMs,
    memoryHeapMB: Math.max(0, memoryHeapMB),
    memoryRssMB,
    opsPerSec,
    avgLatencyUs,
    p50LatencyUs,
    p95LatencyUs,
    p99LatencyUs,
    concurrentOpsPerSec,
  };
}

// ─── Raw Discord.js Benchmark ────────────────────────────────────────────────

async function benchmarkRawDiscordJs(): Promise<MetricResult> {
  if (global.gc) global.gc();
  const startMem = process.memoryUsage();
  const startBoot = performance.now();

  // Realistic bot setup: create client, register multiple handlers
  const client = new DiscordJSClient({ intents: [GatewayIntentBits.Guilds] });
  const service = new BenchmarkService();

  // Register command handlers (realistic: Map of commands, like most real bots)
  const commands = new Map<string, (interaction: any) => Promise<any>>();
  commands.set('ping', async (interaction: any) => {
    const val = interaction.options?.getInteger?.('val') ?? 10;
    const res = service.compute(val);
    return interaction.reply({ content: `Pong! Result: ${res}` });
  });
  commands.set('heavy', async (interaction: any) => {
    const fields = service.buildHeavyPayload(50);
    return interaction.reply({ content: 'Heavy response', embeds: [{ title: 'Heavy', fields }] });
  });
  commands.set('echo', async (interaction: any) => {
    return interaction.reply({ content: `Echo: ${interaction.commandName}` });
  });

  client.on('interactionCreate', async (interaction: any) => {
    if (!interaction.isChatInputCommand?.()) return;
    const handler = commands.get(interaction.commandName);
    if (handler) await handler(interaction);
  });

  // Simulate gateway handshake
  simulateGatewayHandshake(client, 'discordjs');

  const bootTime = performance.now() - startBoot;

  const mockInteract = {
    type: 2,
    commandName: 'ping',
    isChatInputCommand: () => true,
    options: { getInteger: (_: string) => 10 },
    reply: async (data: any) => ({ type: 4, data }),
  };

  // Warmup
  for (let i = 0; i < 1000; i++) client.emit('interactionCreate', mockInteract);

  // Sequential samples
  const SEQUENTIAL = 100_000;
  const startSeq = performance.now();
  const samples = await collectSamples(() => client.emit('interactionCreate', mockInteract), SEQUENTIAL);
  const totalSeqMs = performance.now() - startSeq;

  // Concurrent load
  const CONCURRENT_BATCH = 100;
  const CONCURRENT_ROUNDS = 100;
  const startConc = performance.now();
  for (let r = 0; r < CONCURRENT_ROUNDS; r++) {
    await Promise.all(
      Array.from({ length: CONCURRENT_BATCH }, () =>
        Promise.resolve(client.emit('interactionCreate', mockInteract))
      )
    );
  }
  const totalConcMs = performance.now() - startConc;

  const endMem = process.memoryUsage();

  const startShutdown = performance.now();
  try { client.destroy(); } catch {}
  const shutdownMs = Number((performance.now() - startShutdown).toFixed(2));

  const opsPerSec = Math.round((SEQUENTIAL / totalSeqMs) * 1000);
  const avgLatencyUs = Number(((totalSeqMs / SEQUENTIAL) * 1000).toFixed(2));
  const samplesUs = samples.map((s) => s * 1000);
  const p50LatencyUs = percentile(samplesUs, 50);
  const p95LatencyUs = percentile(samplesUs, 95);
  const p99LatencyUs = percentile(samplesUs, 99);
  const concurrentOpsPerSec = Math.round(((CONCURRENT_BATCH * CONCURRENT_ROUNDS) / totalConcMs) * 1000);
  const memoryHeapMB = Number(((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2));
  const memoryRssMB = Number((endMem.rss / 1024 / 1024).toFixed(2));

  return {
    name: 'Raw Discord.js v14',
    library: 'discord.js',
    type: 'raw',
    bootstrapMs: Number(bootTime.toFixed(2)),
    shutdownMs,
    memoryHeapMB: Math.max(0, memoryHeapMB),
    memoryRssMB,
    opsPerSec,
    avgLatencyUs,
    p50LatencyUs,
    p95LatencyUs,
    p99LatencyUs,
    concurrentOpsPerSec,
  };
}

// ─── Raw Eris Benchmark ──────────────────────────────────────────────────────

async function benchmarkRawEris(): Promise<MetricResult> {
  if (global.gc) global.gc();
  const startMem = process.memoryUsage();
  const startBoot = performance.now();

  const client = new ErisClient('Bot OTg3NjU0MzIxMDk4NzY1NDMyMQ.G12345.abcdefghijklmnopqrstuvwxyz');
  const service = new BenchmarkService();

  const commands = new Map<string, (interaction: any) => Promise<any>>();
  commands.set('ping', async (interaction: any) => {
    const val = interaction.data?.options?.find((o: any) => o.name === 'val')?.value ?? 10;
    const res = service.compute(val);
    return interaction.createMessage({ content: `Pong! Result: ${res}` });
  });
  commands.set('heavy', async (interaction: any) => {
    const fields = service.buildHeavyPayload(50);
    return interaction.createMessage({ content: 'Heavy', embeds: [{ title: 'Heavy', fields }] });
  });
  commands.set('echo', async (interaction: any) => {
    return interaction.createMessage({ content: `Echo: ${interaction.data?.name}` });
  });

  client.on('interactionCreate', async (interaction: any) => {
    if (interaction.type !== 2) return;
    const handler = commands.get(interaction.data?.name);
    if (handler) await handler(interaction);
  });

  simulateGatewayHandshake(client, 'eris');

  const bootTime = performance.now() - startBoot;

  const mockInteract = {
    type: 2,
    data: { name: 'ping', options: [{ name: 'val', value: 10 }] },
    createMessage: async (data: any) => ({ type: 4, data }),
  };

  for (let i = 0; i < 1000; i++) client.emit('interactionCreate', mockInteract);

  const SEQUENTIAL = 100_000;
  const startSeq = performance.now();
  const samples = await collectSamples(() => client.emit('interactionCreate', mockInteract), SEQUENTIAL);
  const totalSeqMs = performance.now() - startSeq;

  const CONCURRENT_BATCH = 100;
  const CONCURRENT_ROUNDS = 100;
  const startConc = performance.now();
  for (let r = 0; r < CONCURRENT_ROUNDS; r++) {
    await Promise.all(
      Array.from({ length: CONCURRENT_BATCH }, () =>
        Promise.resolve(client.emit('interactionCreate', mockInteract))
      )
    );
  }
  const totalConcMs = performance.now() - startConc;

  const endMem = process.memoryUsage();

  const startShutdown = performance.now();
  try { client.disconnect({ reconnect: false }); } catch {}
  const shutdownMs = Number((performance.now() - startShutdown).toFixed(2));

  const opsPerSec = Math.round((SEQUENTIAL / totalSeqMs) * 1000);
  const avgLatencyUs = Number(((totalSeqMs / SEQUENTIAL) * 1000).toFixed(2));
  const samplesUs = samples.map((s) => s * 1000);
  const p50LatencyUs = percentile(samplesUs, 50);
  const p95LatencyUs = percentile(samplesUs, 95);
  const p99LatencyUs = percentile(samplesUs, 99);
  const concurrentOpsPerSec = Math.round(((CONCURRENT_BATCH * CONCURRENT_ROUNDS) / totalConcMs) * 1000);
  const memoryHeapMB = Number(((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2));
  const memoryRssMB = Number((endMem.rss / 1024 / 1024).toFixed(2));

  return {
    name: 'Raw Eris v0.18',
    library: 'eris',
    type: 'raw',
    bootstrapMs: Number(bootTime.toFixed(2)),
    shutdownMs,
    memoryHeapMB: Math.max(0, memoryHeapMB),
    memoryRssMB,
    opsPerSec,
    avgLatencyUs,
    p50LatencyUs,
    p95LatencyUs,
    p99LatencyUs,
    concurrentOpsPerSec,
  };
}

// ─── Raw Oceanic.js Benchmark ─────────────────────────────────────────────────

async function benchmarkRawOceanic(): Promise<MetricResult> {
  if (global.gc) global.gc();
  const startMem = process.memoryUsage();
  const startBoot = performance.now();

  const client = new OceanicClient({
    auth: 'Bot OTg3NjU0MzIxMDk4NzY1NDMyMQ.G12345.abcdefghijklmnopqrstuvwxyz',
  });
  const service = new BenchmarkService();

  const commands = new Map<string, (interaction: any) => Promise<any>>();
  commands.set('ping', async (interaction: any) => {
    const val = interaction.data?.options?.getInteger?.('val') ?? 10;
    const res = service.compute(val);
    return interaction.createMessage({ content: `Pong! Result: ${res}` });
  });
  commands.set('heavy', async (interaction: any) => {
    const fields = service.buildHeavyPayload(50);
    return interaction.createMessage({ content: 'Heavy', embeds: [{ title: 'Heavy', fields }] });
  });
  commands.set('echo', async (interaction: any) => {
    return interaction.createMessage({ content: `Echo: ${interaction.data?.name}` });
  });

  client.on('interactionCreate', async (interaction: any) => {
    if (interaction.type !== 2) return;
    const handler = commands.get(interaction.data?.name);
    if (handler) await handler(interaction);
  });

  simulateGatewayHandshake(client, 'oceanic');

  const bootTime = performance.now() - startBoot;

  const mockInteract = {
    type: 2,
    data: {
      name: 'ping',
      options: { getInteger: (_: string) => 10 },
    },
    createMessage: async (data: any) => ({ type: 4, data }),
  };

  for (let i = 0; i < 1000; i++) client.emit('interactionCreate', mockInteract);

  const SEQUENTIAL = 100_000;
  const startSeq = performance.now();
  const samples = await collectSamples(() => client.emit('interactionCreate', mockInteract), SEQUENTIAL);
  const totalSeqMs = performance.now() - startSeq;

  const CONCURRENT_BATCH = 100;
  const CONCURRENT_ROUNDS = 100;
  const startConc = performance.now();
  for (let r = 0; r < CONCURRENT_ROUNDS; r++) {
    await Promise.all(
      Array.from({ length: CONCURRENT_BATCH }, () =>
        Promise.resolve(client.emit('interactionCreate', mockInteract))
      )
    );
  }
  const totalConcMs = performance.now() - startConc;

  const endMem = process.memoryUsage();

  const startShutdown = performance.now();
  try { client.disconnect(); } catch {}
  const shutdownMs = Number((performance.now() - startShutdown).toFixed(2));

  const opsPerSec = Math.round((SEQUENTIAL / totalSeqMs) * 1000);
  const avgLatencyUs = Number(((totalSeqMs / SEQUENTIAL) * 1000).toFixed(2));
  const samplesUs = samples.map((s) => s * 1000);
  const p50LatencyUs = percentile(samplesUs, 50);
  const p95LatencyUs = percentile(samplesUs, 95);
  const p99LatencyUs = percentile(samplesUs, 99);
  const concurrentOpsPerSec = Math.round(((CONCURRENT_BATCH * CONCURRENT_ROUNDS) / totalConcMs) * 1000);
  const memoryHeapMB = Number(((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2));
  const memoryRssMB = Number((endMem.rss / 1024 / 1024).toFixed(2));

  return {
    name: 'Raw Oceanic.js v1.14',
    library: 'oceanic.js',
    type: 'raw',
    bootstrapMs: Number(bootTime.toFixed(2)),
    shutdownMs,
    memoryHeapMB: Math.max(0, memoryHeapMB),
    memoryRssMB,
    opsPerSec,
    avgLatencyUs,
    p50LatencyUs,
    p95LatencyUs,
    p99LatencyUs,
    concurrentOpsPerSec,
  };
}

// ─── Raw Discordeno Benchmark ─────────────────────────────────────────────────

async function benchmarkRawDiscordeno(): Promise<MetricResult> {
  if (global.gc) global.gc();
  const startMem = process.memoryUsage();
  const startBoot = performance.now();

  const service = new BenchmarkService();

  const commands = new Map<string, (interaction: any) => any>();
  commands.set('ping', (interaction: any) => {
    const val = interaction.data?.options?.find((o: any) => o.name === 'val')?.value ?? 10;
    const res = service.compute(val);
    return { type: 4, data: { content: `Pong! Result: ${res}` } };
  });
  commands.set('heavy', () => {
    const fields = service.buildHeavyPayload(50);
    return { type: 4, data: { content: 'Heavy', embeds: [{ title: 'Heavy', fields }] } };
  });
  commands.set('echo', (interaction: any) => ({
    type: 4,
    data: { content: `Echo: ${interaction.data?.name}` },
  }));

  const bot = createDiscordenoBot({
    token: 'OTg3NjU0MzIxMDk4NzY1NDMyMQ.G12345.abcdefghijklmnopqrstuvwxyz',
    events: {
      interactionCreate: async (interaction: any) => {
        if (interaction.type !== 2) return;
        const handler = commands.get(interaction.data?.name);
        if (handler) return handler(interaction);
      },
    },
  });

  const bootTime = performance.now() - startBoot;

  const mockInteract = {
    id: '123456789012345678',
    token: 'interaction-token-abc',
    type: 2,
    data: { name: 'ping', options: [{ name: 'val', value: 10 }] },
    guildId: '111222333444555666',
    channelId: '777888999000111222',
  };

  const dispatch = async () => {
    if (bot.events.interactionCreate) {
      await bot.events.interactionCreate(mockInteract as any, bot as any);
    }
  };

  // Warmup
  for (let i = 0; i < 1000; i++) await dispatch();

  const SEQUENTIAL = 100_000;
  const startSeq = performance.now();
  const samples = await collectSamples(dispatch, SEQUENTIAL);
  const totalSeqMs = performance.now() - startSeq;

  const CONCURRENT_BATCH = 100;
  const CONCURRENT_ROUNDS = 100;
  const startConc = performance.now();
  for (let r = 0; r < CONCURRENT_ROUNDS; r++) {
    await Promise.all(Array.from({ length: CONCURRENT_BATCH }, dispatch));
  }
  const totalConcMs = performance.now() - startConc;

  const endMem = process.memoryUsage();

  const opsPerSec = Math.round((SEQUENTIAL / totalSeqMs) * 1000);
  const avgLatencyUs = Number(((totalSeqMs / SEQUENTIAL) * 1000).toFixed(2));
  const samplesUs = samples.map((s) => s * 1000);
  const p50LatencyUs = percentile(samplesUs, 50);
  const p95LatencyUs = percentile(samplesUs, 95);
  const p99LatencyUs = percentile(samplesUs, 99);
  const concurrentOpsPerSec = Math.round(((CONCURRENT_BATCH * CONCURRENT_ROUNDS) / totalConcMs) * 1000);
  const memoryHeapMB = Number(((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2));
  const memoryRssMB = Number((endMem.rss / 1024 / 1024).toFixed(2));

  return {
    name: 'Raw Discordeno v21',
    library: 'discordeno',
    type: 'raw',
    bootstrapMs: Number(bootTime.toFixed(2)),
    shutdownMs: 0,
    memoryHeapMB: Math.max(0, memoryHeapMB),
    memoryRssMB,
    opsPerSec,
    avgLatencyUs,
    p50LatencyUs,
    p95LatencyUs,
    p99LatencyUs,
    concurrentOpsPerSec,
  };
}

// ─── Suite Runner ─────────────────────────────────────────────────────────────

async function runSuite() {
  const isJson = process.argv.includes('--json');
  const isSave = process.argv.includes('--save');

  if (!isJson) {
    console.log('===============================================================');
    console.log('⚡ SHARDIX MULTI-ADAPTER PERFORMANCE BENCHMARK SUITE');
    console.log('===============================================================');
    console.log('  Simulating realistic bot lifecycle per library:');
    console.log('  › Instantiate client + register multiple command handlers');
    console.log('  › Simulate IDENTIFY → READY → GUILD_CREATE gateway sequence');
    console.log('  › 1,000 warmup interactions');
    console.log('  › 100,000 sequential dispatches → p50/p95/p99 latency');
    console.log('  › 10,000 concurrent dispatches (100 × 100 parallel)');
    console.log('  › Graceful teardown / shutdown\n');
  }

  const results: MetricResult[] = [];

  // ── Shardix Core (Mock adapter — pure framework overhead)
  process.stdout.write('  [1/9] Shardix Core (Mock Adapter)... ');
  results.push(await benchmarkShardixWithAdapter('Shardix Core (Mock)', 'shardix', new MockDiscordAdapter()));
  console.log('✓');

  // ── Discord.js pair
  process.stdout.write('  [2/9] Raw Discord.js v14... ');
  results.push(await benchmarkRawDiscordJs());
  console.log('✓');

  process.stdout.write('  [3/9] Shardix + DiscordJSAdapter... ');
  results.push(await benchmarkShardixWithAdapter('Shardix + Discord.js', 'discord.js', new DiscordJSAdapter()));
  console.log('✓');

  // ── Eris pair
  process.stdout.write('  [4/9] Raw Eris v0.18... ');
  results.push(await benchmarkRawEris());
  console.log('✓');

  process.stdout.write('  [5/9] Shardix + ErisAdapter... ');
  results.push(await benchmarkShardixWithAdapter('Shardix + Eris', 'eris', new ErisAdapter()));
  console.log('✓');

  // ── Oceanic.js pair
  process.stdout.write('  [6/9] Raw Oceanic.js v1.14... ');
  results.push(await benchmarkRawOceanic());
  console.log('✓');

  process.stdout.write('  [7/9] Shardix + OceanicAdapter... ');
  results.push(await benchmarkShardixWithAdapter('Shardix + Oceanic.js', 'oceanic.js', new OceanicAdapter()));
  console.log('✓');

  // ── Discordeno pair
  process.stdout.write('  [8/9] Raw Discordeno v21... ');
  results.push(await benchmarkRawDiscordeno());
  console.log('✓');

  process.stdout.write('  [9/9] Shardix + DiscordenoAdapter... ');
  results.push(await benchmarkShardixWithAdapter('Shardix + Discordeno', 'discordeno', new DiscordenoAdapter()));
  console.log('✓');

  console.log('');

  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Pretty print
    const cols = ['name', 'bootstrapMs', 'memoryRssMB', 'opsPerSec', 'p50LatencyUs', 'p95LatencyUs', 'p99LatencyUs', 'concurrentOpsPerSec'] as const;
    const display = results.map((r) => ({
      name: r.name,
      'boot(ms)': r.bootstrapMs,
      'rss(MB)': r.memoryRssMB,
      'ops/sec': r.opsPerSec.toLocaleString(),
      'p50(µs)': r.p50LatencyUs,
      'p95(µs)': r.p95LatencyUs,
      'p99(µs)': r.p99LatencyUs,
      'conc ops/sec': r.concurrentOpsPerSec.toLocaleString(),
    }));
    console.table(display);

    console.log('===============================================================');
    console.log('📊 BENCHMARK SUMMARY');
    console.log('===============================================================');
    const rawDjs = results.find((r) => r.library === 'discord.js' && r.type === 'raw')!;
    const shardixDjs = results.find((r) => r.library === 'discord.js' && r.type === 'shardix')!;
    if (rawDjs && shardixDjs) {
      const overheadP50 = (shardixDjs.p50LatencyUs - rawDjs.p50LatencyUs).toFixed(2);
      const overheadP95 = (shardixDjs.p95LatencyUs - rawDjs.p95LatencyUs).toFixed(2);
      console.log(`• Shardix vs Raw Discord.js — p50 overhead: +${overheadP50} µs | p95 overhead: +${overheadP95} µs`);
    }
    const shardixCore = results.find((r) => r.library === 'shardix')!;
    if (shardixCore) {
      console.log(`• Shardix Core throughput: ${shardixCore.opsPerSec.toLocaleString()} ops/sec (${shardixCore.concurrentOpsPerSec.toLocaleString()} concurrent)`);
    }
    console.log('---------------------------------------------------------------\n');
  }

  if (isSave) {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const docsDir = path.resolve(process.cwd(), 'docs');

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      results,
    };

    // Save JSON
    fs.writeFileSync(
      path.join(docsDir, 'benchmark-latest.json'),
      JSON.stringify(payload, null, 2)
    );

    // Save Markdown table
    const markdownTable = [
      '# Latest Benchmark Results (CI Automated)',
      '',
      `> **Generated**: ${payload.timestamp}`,
      `> **Node.js**: ${payload.nodeVersion} (${payload.platform}/${payload.arch})`,
      '',
      '| Engine / Adapter | Boot (ms) | RSS (MB) | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Conc. Ops/sec |',
      '|------------------|-----------|----------|---------|----------|----------|----------|---------------|',
      ...results.map((r) =>
        `| **${r.name}** | ${r.bootstrapMs} | ${r.memoryRssMB} | ${r.opsPerSec.toLocaleString()} | ${r.p50LatencyUs} | ${r.p95LatencyUs} | ${r.p99LatencyUs} | ${r.concurrentOpsPerSec.toLocaleString()} |`
      ),
      '',
      '---',
      '*Automated benchmark generated by Shardix CI pipeline.*',
    ].join('\n');

    fs.writeFileSync(path.join(docsDir, 'benchmark-latest.md'), markdownTable);

    console.log('✅ Saved results → docs/benchmark-latest.json & docs/benchmark-latest.md');
  }
}

runSuite()
  .then(() => {
    // Force exit — some libraries (Eris, Oceanic) keep the process alive with background
    // heartbeat timers. After benchmarks complete, we just exit cleanly.
    process.exit(0);
  })
  .catch((err) => {
    console.error('[benchmark] Fatal error:', err);
    process.exit(1);
  });
