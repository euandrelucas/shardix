# ADR 0017: Eventos Distribuídos e Travas (Distributed Locks)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Em ambientes em cluster, agendamentos cron e mutações críticas de estado não podem ser executados simultaneamente por múltiplos trabalhadores.

## Decisões Arquiteturais

### 1. `EventBus.emitDistributed(topic, payload)`
- Transmite eventos para todas as instâncias do cluster através da camada IPC/Redis.

### 2. Trava Distribuída (Distributed Lock) para `@Cron()`
- O agendador `@Cron()` utiliza travas de exclusão mútua (`cache.lock(lockKey, ttl)`) para garantir que exatamente **um único trabalhador** execute tarefas agendadas por intervalo.

## Consequências

- Eliminação de race conditions e execuções duplicadas em agendamentos distribuídos.
