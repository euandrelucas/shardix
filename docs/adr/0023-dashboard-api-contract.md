# ADR 0023: Contrato da API REST do Dashboard

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A interface Web do Dashboard precisa de um contrato estável para renderizar o estado de aplicação, métricas de saúde, workers, shards, eventos e logs.

## Endpoints do Contrato
- `GET /api/application`: Resumo geral da aplicação e uptime.
- `GET /api/runtime`: Informações sobre o Runtime ativo (Gateway, HTTP, Hybrid, Distributed).
- `GET /api/workers`: Lista de trabalhadores do cluster com CPU, memória e status.
- `GET /api/shards`: Lista de Shards ativas e latências associadas.
- `GET /api/health`: Estado de saúde de todos os serviços.
- `GET /api/plugins`: Lista de plugins registrados.
- `GET /api/providers`: Lista de provedores de infraestrutura ativos.
- `GET /api/events`: Taxa de eventos processados e distribuição.
- `GET /api/logs`: Registros de log estruturados.
- `GET /api/metrics`: Métricas de latência e contagem de comandos.

## Consequências

- Desacoplamento entre backend da aplicação e qualquer cliente web do Control Plane.
