# ADR 0012: Ecossistema de Provedores Oficiais

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Para oferecer uma experiência completa de produção sem acoplar o Core, o Shardix mantém pacotes de provedores oficiais sob a organização `@shardix/*`.

## Provedores Oficiais Implementados
1. `@shardix/provider-config`: Carregamento e validação de `shardix.config.ts` e variáveis de ambiente.
2. `@shardix/provider-logger`: Sistema de logging estruturado (JSON, Pretty, Trace IDs, Request IDs).
3. `@shardix/provider-cache`: Gerenciamento de cache em Memória e Redis com TTL e Namespaces.
4. `@shardix/provider-eventbus`: Barramento de eventos local e Pub/Sub distribuído com Redis.
5. `@shardix/provider-health`: Sondas de integridade `/health`, `/ready` e `/live` para Docker e Kubernetes.

## Consequências

- Soluções prontas para produção sem comprometer a estabilidade ou o tamanho do Core.
