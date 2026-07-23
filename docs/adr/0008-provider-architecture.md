# ADR 0008: Arquitetura de Providers

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Conforme o Shardix evolui, recursos externos como logging, cache, Redis, validação de configurações, métricas e health checks não devem poluir o núcleo (`@shardix/core`). Para manter a filosofia de Clean Architecture e SOLID, a v0.3 introduz o conceito de **Providers**.

## Decisões Arquiteturais

### 1. Atualização da Hierarquia de Camadas

```text
Application  ──>  Runtime  ──>  Transport  ──>  Adapter  ──>  Providers
```

### 2. Contrato `ProviderContract`

```typescript
export interface ProviderContract {
  readonly name: string;
  readonly version: string;
  register(app: any): Promise<void>;
  boot?(): Promise<void>;
  shutdown?(): Promise<void>;
}
```

### 3. Desacoplamento do Core
- O `@shardix/core` não contém código direto de pino, redis ou fastify.
- Todos os recursos de infraestrutura externos são empacotados como pacotes desacoplados `@shardix/provider-*`.

## Consequências

- Extensibilidade total por terceiros.
- Zero peso morto no bundle para aplicações que não utilizam determinados provedores.
