# Introdução

**Shardix** é um framework de arquitetura corporativa para bots e aplicações de Discord em Node.js e TypeScript.

## Por que Shardix?

1. **Zero Vendor Lock-in**: Sua regra de negócio fica desacoplada de Discord.js, Eris, Oceanic.js ou Discordeno.
2. **Arquitetura Corporativa em Camadas**: `Application -> Runtime -> Transport -> Adapter -> Providers`.
3. **Sharding Automático & Workers Distribuídos**: Execute clusters em threads de processo e containers Docker sem duplicação de eventos.
4. **Control Plane Dashboard Integrado**: Telemetria em tempo real, saúde dos trabalhadores, analíticos de comandos executados e logs ao vivo.
