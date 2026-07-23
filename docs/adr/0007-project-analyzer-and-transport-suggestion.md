# ADR 0007: Analisador de Projeto (Project Analyzer) e Sugestão de Transports

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Muitas aplicações no Discord se conectam via WebSocket Gateway desnecessariamente quando utilizam apenas Slash Commands, Buttons, Modals e Autocompletes. Isso desperdiça recursos (CPU, RAM e heartbeat).

## Decisões Arquiteturais

### 1. `ProjectAnalyzer` Engine
- Inspeciona os metadados de todos os controllers e handlers registrados.
- Se nenhuma assinatura `@Event()` de eventos de Gateway (ex: `guildMemberAdd`, `voiceStateUpdate`, `messageCreate`) for detectada:
  - O analisador gera um aviso informativo sugerindo o uso de `HttpRuntime`.
- Se apenas eventos de Gateway forem utilizados:
  - Sugere `GatewayRuntime`.
- Se ambos existirem:
  - Sugere `HybridRuntime`.

## Consequências

- Orientação proativa ao desenvolvedor sobre eficiência de infraestrutura e custo de hospedagem.
