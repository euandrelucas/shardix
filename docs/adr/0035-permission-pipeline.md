# ADR 0035: Pipeline Decorativo de Permissões & Segurança

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Validar se o comando é restrito a servidores (`@GuildOnly`), mensagens privadas (`@DMOnly`) ou se exige permissões especiais.

## Decisão

Adicionar decorators de metadados avaliados automaticamente antes de invocar os handlers de interações.
