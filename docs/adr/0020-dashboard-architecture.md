# ADR 0020: Arquitetura do Dashboard (Control Plane)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Aplicações corporativas de Discord necessitam de visibilidade centralizada sobre a saúde dos trabalhadores (workers), distribuição de shards, volume de eventos, latência de comandos e logs sem acoplar a aplicação a dependências pesadas de frontend.

## Decisões Arquiteturais

### 1. Separação Estrita de Camadas

```text
Shardix Application  ──>  Dashboard Provider  ──>  Dashboard API  ──>  Dashboard Web UI
```

### 2. Princípios
- A aplicação Shardix é completamente funcional sem o Dashboard ativado.
- O Dashboard consome apenas rotas protegidas da `DashboardAPI`.

## Consequências

- Zero overhead para aplicações em produção que optarem por utilizar dashboards externos via Prometheus/Grafana.
