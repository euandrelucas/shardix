# ADR 0033: Sistema Oficial de Collectors (`CollectorManager`)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Aguardar respostas de botões, formulários modais e menus drop-down requer leitores temporários assíncronos.

## Decisão

Criar o `CollectorManager` e `ComponentCollector` permitindo aguardar interações com `awaitComponent()`.
