import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { ClusterManager } from '@shardix/cluster';
import { DashboardProvider } from '@shardix/provider-dashboard';
import { ShardixApplication } from '../src/index.js';

describe('Dashboard Provider & Control Plane (v0.5)', () => {
  it('ClusterManager should automatically calculate unique Shard IDs per Worker', () => {
    const cluster = new ClusterManager();
    cluster.workers(4);

    const workers = cluster.getWorkerList();
    expect(workers.length).toBe(4);

    expect(workers[0].shardId).toBe(0);
    expect(workers[0].totalShards).toBe(4);

    expect(workers[1].shardId).toBe(1);
    expect(workers[1].totalShards).toBe(4);

    expect(workers[2].shardId).toBe(2);
    expect(workers[3].shardId).toBe(3);
  });

  it('DashboardProvider should boot API server gracefully', async () => {
    const provider = new DashboardProvider({ port: 3008 });
    const app = new ShardixApplication({ autoAnalyze: false });

    app.use(provider);
    await app.start();

    const server = provider.getServer();
    expect(server).toBeDefined();

    await app.stop();
  });
});
