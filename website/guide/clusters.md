# Workers & Clusters

Shardix includes native process clustering and automatic Shard calculation to scale Discord bots to millions of guilds without duplicate event processing.

---

## 🧮 Automatic Shard Allocation

When running $N$ worker threads or child processes, Shardix automatically calculates and assigns unique shard ranges for each worker node:

$$\text{shardId} = i \quad (0 \le i < N)$$
$$\text{totalShards} = N$$

This prevents multiple instances from receiving duplicate Gateway WebSocket events.

---

## 💻 Cluster Manager (`ClusterManager`)

```typescript
import { ClusterManager } from '@shardix/cluster';

const cluster = new ClusterManager({
  workerCount: 4,
  execPath: './dist/worker.js',
});

await cluster.spawn();
console.log('🚀 Cluster spawned 4 workers with automatic shard allocation.');
```

---

## 📡 Internal IPC Layer (`@shardix/ipc`)

Communicate across worker processes using local process IPC or Redis Pub/Sub:

```typescript
import { LocalIPCTransport } from '@shardix/ipc';

const ipc = new LocalIPCTransport();

// Subscribe to worker broadcasts
ipc.subscribe('stats:update', (data) => {
  console.log('Received worker stats:', data);
});

// Broadcast event to all workers
await ipc.broadcast('stats:update', { workerId: process.pid, memoryUsage: process.memoryUsage().heapUsed });
```
