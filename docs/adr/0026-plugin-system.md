# ADR 0026: Sistema Oficial de Plugins & Fundação do Marketplace

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Para permitir que a comunidade e empresas estendam o Shardix com funcionalidades avançadas (como Economia, Moderação, Música e Integrações de pagamento) sem inflar o Core, é necessário um sistema oficial de plugins.

## Decisão

Criar o pacote `@shardix/plugin` definindo a interface `ShardixPlugin` (`register`, `onInit`, `onShutdown`) e o manifesto `shardix.json`.

## Consequências

- Extensibilidade total do ecossistema.
