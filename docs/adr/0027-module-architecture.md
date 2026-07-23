# ADR 0027: Arquitetura Modular Empresarial

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Aplicações de grande porte exigem isolamento por domínio (ex: `auth/`, `economy/`, `moderation/`).

## Decisão

Aprimorar o decorator `@Module({ imports: [], providers: [], controllers: [], exports: [] })` e o `AutoScanner` para resolver árvores de módulos aninhadas com isolamento de contexto.

## Consequências

- Organização limpa e escalável para monorepos e microsserviços.
