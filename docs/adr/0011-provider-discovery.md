# ADR 0011: Descoberta e Registro de Providers

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Os desenvolvedores devem conseguir registrar Providers com fluidez na aplicação via opções de configuração ou método fluente `app.use(Provider)`.

## Decisões Arquiteturais

### Métodos de Registro Suportados
1. Método fluente: `app.use(new LoggerProvider())` ou `app.use(LoggerProvider)`.
2. Opções da Factory: `ShardixFactory.create({ providers: [LoggerProvider, CacheProvider] })`.

## Consequências

- Interface de registro uniforme e altamente ergonômica.
