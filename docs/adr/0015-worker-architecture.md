# ADR 0015: Arquitetura de Trabalhadores (Worker Architecture)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A paralelização de tarefas pode exigir execução baseada em threads leves (Worker Threads) ou isolamento total de processos (Child Processes / Containers).

## Decisões Arquiteturais

### 1. Interface Unificada `WorkerNode`

```typescript
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  memoryUsage: number;
  uptime: number;
}

export interface WorkerNode {
  readonly id: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthStatus>;
}
```

### 2. Suporte a Múltiplos Motores
- `ThreadWorkerNode`: Executa trabalhadores via `node:worker_threads`.
- `ProcessWorkerNode`: Executa trabalhadores via `node:child_process`.

## Consequências

- Flexibilidade para escolher o nível de isolamento de memória ideal para cada workload.
