# ADR 0014: Arquitetura de Runtime Distribuído

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Aplicações Discord de grande porte precisam operar distribuídas em múltiplos nós e processos sem que o código de negócio precise lidar manualmente com sockets IPC, locks distribuídos ou roteamento de mensagens entre workers.

## Decisões Arquiteturais

### 1. Pacote `@shardix/runtime-distributed`

```text
                 Application
                     │
             Distributed Runtime
        ┌────────────┼────────────┐
     Worker       Worker       Worker
        │            │            │
   Transport    Transport    Transport
```

### 2. Responsabilidades do `DistributedRuntime`
- Instanciar e orquestrar múltiplos trabalhadores (`Worker`).
- Monitorar a integridade (Healthchecks) de cada trabalhador.
- Reiniciar trabalhadores falhos automaticamente de forma graciosa sem perder o estado global.

## Consequências

- Transparência total: o desenvolvedor registra comandos e serviços normalmente, enquanto o framework gerencia a paralelização.
