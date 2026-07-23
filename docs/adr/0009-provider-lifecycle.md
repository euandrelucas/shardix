# ADR 0009: Ciclo de Vida dos Providers

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Providers necessitam participar de fases previsíveis de inicialização e encerramento, garantindo que conexões (Redis, HTTP, Banco) estejam estabelecidas antes do boot e encerradas de forma segura durante o shutdown.

## Decisões Arquiteturais

### Fases do Ciclo de Vida
1. **Fase 1: `register(app)`**: Registra instâncias e serviços no Container IoC.
2. **Fase 2: `boot()`**: Executa a inicialização assíncrona (conexões de rede, aquecimento de cache). Executado antes do Runtime iniciar a escuta de requisições.
3. **Fase 3: `shutdown()`**: Executado no encerramento da aplicação para fechar conexões de forma segura.

## Consequências

- Inicialização assíncrona segura e previsível.
