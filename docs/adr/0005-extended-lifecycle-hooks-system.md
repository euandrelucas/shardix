# ADR 0005: Sistema Expandido de Lifecycle Hooks

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Aplicações enterprise necessitam de etapas previsíveis para inicialização de conexões de banco de dados, aquecimento de caches, fechamento limpo de conexões (Graceful Shutdown) e liberação de recursos ao encerrar instâncias ou pods em clusters.

## Decisões Arquiteturais

### Hooks Suportados

1. `OnModuleInit`: Executado após a instanciação do módulo e a injeção de suas dependências.
2. `OnApplicationBootstrap`: Executado imediatamente antes do Runtime iniciar a escuta de conexões/transportes.
3. `OnModuleDestroy`: Executado quando um módulo é destruído ou durante a desmontagem da aplicação.
4. `OnApplicationShutdown`: Executado quando a aplicação recebe um sinal de término (`SIGTERM`, `SIGINT`) ou quando `app.stop()` é invocado.

```typescript
export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): void | Promise<void>;
}
```

## Consequências

- Garantia de encerramento seguro e liberação de conexões sem perda de eventos em andamento (Graceful Shutdown).
