# ADR 0041: Sistema Completo de Collectors

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Aguardar interações síncronas e assíncronas com botões, modais, mensagens e reações.

## Decisão

Adicionar `MessageCollector`, `ButtonCollector`, `SelectCollector`, `ModalCollector`, `ReactionCollector` com suporte a `AsyncIterator`.
