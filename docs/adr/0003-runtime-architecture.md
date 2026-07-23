# ADR 0003: Arquitetura do Runtime System

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Na versão v0.1, a aplicação Shardix gerenciava diretamente a comunicação entre o `InteractionRouter` e os `Transports`. Conforme o framework evolui para suportar sharding, clustering, execução serverless/edge e deploys no Kubernetes, faz-se necessária uma camada intermediária encarregada da infraestrutura e orquestração do ciclo de vida da execução.

## Decisões Arquiteturais

### 1. Hierarquia de Camadas

```text
Application  ──>  Runtime  ──>  Transport  ──>  Adapter
```

### 2. Interface Pública `Runtime`

```typescript
export interface Runtime {
  readonly name: string;
  start(app: ShardixApplication): Promise<void>;
  stop(): Promise<void>;
}
```

### 3. Implementações Iniciais do Runtime
- **`GatewayRuntime`**: Gerencia bots conectados por WebSocket Gateway, cuidando do heartbeat, reconexões, sharding e contagem de latência.
- **`HttpRuntime`**: Gerencia a recepção HTTP de interações (Fastify), desativando completamente WebSockets e sharding para economizar memória e CPU.
- **`HybridRuntime`**: Orquestra simultaneamente conexões de Gateway para eventos gerais e HTTP Interactions para resposta síncrona a interações slash/componentes.

## Consequências

- Separação clara entre a lógica de orquestração de runtime e o barramento de transporte.
- Facilidade em adicionar futuros Runtimes como `ClusterRuntime` ou `EdgeRuntime`.
