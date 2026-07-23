# ADR 0016: Camada de Comunicação Interna (IPC Layer)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Os trabalhadores operando em processos ou containers separados precisam trocar mensagens de sincronização, repassar requisições e notificar eventos globais.

## Decisões Arquiteturais

### 1. Interface `MessageTransport` (`@shardix/ipc`)

```typescript
export interface MessageTransport {
  send(targetWorkerId: string, topic: string, payload: any): Promise<void>;
  broadcast(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload: any) => void): void;
}
```

### 2. Implementações
- **`LocalIPCTransport`**: Troca mensagens entre Worker Threads / Child Processes na mesma máquina via eventos nativos.
- **`RedisIPCTransport`**: Troca mensagens entre máquinas e clusters distintos via Redis Pub/Sub.

## Consequências

- Comunicação inter-processos transparente independente da topologia de infraestrutura.
