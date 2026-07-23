# Workers & Clusters

O Shardix inclui suporte nativo a processos em cluster e cálculo automático de Shards para escalar bots para milhões de servidores sem eventos duplicados.

---

## 🧮 Alocação Automática de Shards

Ao executar $N$ processos trabalhadores (workers), o Shardix calcula e atribui automaticamente fatias de shard únicas para cada nó:

$$\text{shardId} = i \quad (0 \le i < N)$$
$$\text{totalShards} = N$$

Isso impede que múltiplas instâncias recebam eventos de WebSocket em duplicidade.

---

## 💻 Gerenciador de Cluster (`ClusterManager`)

```typescript
import { ClusterManager } from '@shardix/cluster';

const cluster = new ClusterManager({
  workerCount: 4,
  execPath: './dist/worker.js',
});

await cluster.spawn();
console.log('🚀 Cluster iniciado com 4 workers e cálculo automático de shards.');
```

---

## 📡 Camada Interna de IPC (`@shardix/ipc`)

Comunique-se entre processos usando IPC local ou Pub/Sub via Redis:

```typescript
import { LocalIPCTransport } from '@shardix/ipc';

const ipc = new LocalIPCTransport();

// Inscreve-se em transmissões dos trabalhadores
ipc.subscribe('stats:update', (data) => {
  console.log('Estatísticas do worker recebidas:', data);
});

// Transmite evento para todos os workers
await ipc.broadcast('stats:update', { workerId: process.pid, memoryUsage: process.memoryUsage().heapUsed });
```
