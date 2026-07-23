# Referência da API de Cluster & IPC

Referência de API para o gerenciador de cluster, sharding de workers e mensageria interna IPC do Shardix.

---

## `ClusterManager`

```typescript
class ClusterManager {
  constructor(options: ClusterOptions);
  spawn(): Promise<void>;
  shutdown(): Promise<void>;
  getWorkers(): WorkerNode[];
}
```

---

## `LocalIPCTransport`

```typescript
class LocalIPCTransport {
  subscribe(event: string, handler: (data: any) => void): void;
  broadcast(event: string, data: any): Promise<void>;
}
```
