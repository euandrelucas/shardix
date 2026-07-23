# ADR 0018: Sistema de Filas Distribuídas (`@shardix/provider-queue`)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Processamentos pesados (renderização de imagens, envio massivo de mensagens, sincronização de dados) não devem bloquear a resposta de interações.

## Decisões Arquiteturais

### 1. Pacote `@shardix/provider-queue`
- Abstração unificada `QueueService` com suporte a:
  - `addJob(queueName, data, options)`
  - Retries automáticos com backoff exponencial.
  - Delayed jobs (agendados para execução futura).
  - Dead Letter Queues (Failed jobs).

### 2. Provedores
- `MemoryQueueProvider`: Para desenvolvimento e testes unitários locais.
- `RedisQueueProvider` / `BullMQ`: Para produção escalável em clusters.

## Consequências

- Respostas instantâneas para o usuário no Discord com processamento assíncrono em background.
