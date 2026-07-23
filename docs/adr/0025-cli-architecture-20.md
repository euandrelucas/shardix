# ADR 0025: Arquitetura do Shardix CLI 2.0 & Developer Experience

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Um ecossistema corporativo precisa de uma CLI completa que cubra todo o ciclo de vida da aplicação (criação, desenvolvimento local com hot reloading, diagnóstico, testes de benchmark e migração).

## Decisão

Evoluir o `@shardix/cli` para incluir subcomandos essenciais: `new`, `generate`, `dev`, `build`, `deploy`, `doctor`, `info`, `benchmark`, `migrate`.

## Consequências

- Inicialização instantânea de projetos com física escrita de arquivos em disco.
- Redução drástica de atrito para novos desenvolvedores.
