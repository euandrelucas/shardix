# ADR 0019: Observabilidade e Dashboard API

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Sistemas em produção exigem coleta contínua de métricas de saúde, latência, throughput de comandos, erros e estatísticas de memória dos trabalhadores.

## Decisões Arquiteturais

### 1. `@shardix/provider-observability`
- Coleta métricas de latência de interações, erros, contagem de comandos, heartbeat e uso de memória.
- Exporta formato compatível com Prometheus e OpenTelemetry.

### 2. `@shardix/dashboard-api`
- API REST HTTP para consulta e integração com dashboards externos:
  - `GET /applications`
  - `GET /workers`
  - `GET /health`
  - `GET /metrics`
  - `GET /events`
  - `GET /logs`

## Consequências

- Visibilidade total do estado da aplicação e infraestrutura de produção.
