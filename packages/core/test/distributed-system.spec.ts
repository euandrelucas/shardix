import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { ClusterManager } from '@shardix/cluster';
import { LocalIPCTransport } from '@shardix/ipc';
import { DistributedRuntime } from '@shardix/runtime-distributed';
import { QueueProvider, QueueService } from '@shardix/provider-queue';
import { ObservabilityProvider } from '@shardix/provider-observability';
import { ShardixApplication } from '../src/index.js';

describe('Distributed Runtime, Cluster, IPC & Queue (v0.4)', () => {
  it('ClusterManager should spawn workers and report health', async () => {
    const cluster = new ClusterManager();
    cluster.workers(3);

    const workerList = cluster.getWorkerList();
    expect(workerList.length).toBe(3);

    await cluster.startAll();

    for (const w of workerList) {
      const h = await w.health();
      expect(h.status).toBe('healthy');
    }

    await cluster.stopAll();
  });

  it('LocalIPCTransport should transmit messages between topics', async () => {
    const ipc = new LocalIPCTransport();
    let receivedPayload: any = null;

    ipc.subscribe('user:levelup', (payload) => {
      receivedPayload = payload;
    });

    await ipc.broadcast('user:levelup', { userId: '123', level: 10 });
    expect(receivedPayload).toEqual({ userId: '123', level: 10 });
  });

  it('DistributedRuntime should boot workers and communicate via IPC', async () => {
    const runtime = new DistributedRuntime({ workerCount: 2 });
    const app = new ShardixApplication({ runtime, autoAnalyze: false });

    await app.start();

    const cluster = runtime.getCluster();
    expect(cluster.getWorkerList().length).toBe(2);

    await app.stop();
  });

  it('QueueService should process background jobs and retries', async () => {
    const queue = new QueueService();
    let processedData: any = null;

    queue.process('sendEmail', async (job) => {
      processedData = job.data;
    });

    const job = await queue.add('sendEmail', { to: 'user@shardix.dev' });
    expect(job.name).toBe('sendEmail');
    expect(processedData).toEqual({ to: 'user@shardix.dev' });
  });

  it('ObservabilityProvider should record commands and export metrics', async () => {
    const provider = new ObservabilityProvider();
    const app = new ShardixApplication({ autoAnalyze: false });

    app.use(provider);
    await app.start();

    const obs = provider.getService();
    obs.recordCommand();
    obs.recordCommand();

    const metrics = obs.getMetrics();
    expect(metrics.totalCommandsExecuted).toBe(2);

    await app.stop();
  });
});
