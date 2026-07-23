# ADR 0001: Visão Geral da Arquitetura e Estrutura do Monorepo

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A maioria das aplicações e bots desenvolvidos para a plataforma Discord baseia-se em bibliotecas imperativas ou orientadas a manipuladores de eventos diretos (como `discord.js`, `Eris` ou `Discordeno`). Embora eficientes para bots pequenos e médios, tais abordagens costumam levar a um acoplamento forte com a API/biblioteca utilizada, código espaguete, dificuldade em gerenciar escopos de dependências, falta de padrões de teste automatizados e incapacidade de escalar a recepção de interações via HTTP sem reescrever a arquitetura base.

O **Shardix** visa solucionar essa lacuna fornecendo um framework de arquitetura declarativo, desacoplado, extensível e pronto para escalabilidade (semelhante ao papel que o NestJS possui no ecossistema Node.js).

## Decisões Arquiteturais

### 1. Monorepo com `pnpm` Workspaces & `Turborepo`

Adotamos a estrutura de monorepo para facilitar o desenvolvimento modular e versionamento dos pacotes oficiais sob a organização `@shardix/*`.

**Estrutura de Pacotes Primários**:
- `packages/common`: Interfaces públicas, metadados globais, tokens e decorators utilitários.
- `packages/core`: Container IoC, motor de injeção de dependência, lifecycle hooks (`onModuleInit`, `onApplicationBootstrap`) e gerenciamento de aplicação (`ShardixFactory`).
- `packages/transport`: Abstração de transportes (`GatewayTransport`, `HttpInteractionsTransport`) e barramento universal de eventos e interações.
- `packages/discordjs`: Adapter oficial para integração com `discord.js`.
- `packages/logger`: Sistema de logs estruturado baseado em contexto e Trace ID.
- `packages/cache`: Abstração de cache com provedores Memory e Redis.
- `packages/events`: EventBus local e pub/sub distribuído.
- `packages/cli`: Ferramenta CLI (`create-shardix`) para scaffold de projetos.

### 2. Inversão de Controle (IoC) & Injeção de Dependências (DI)

- Utilização de `reflect-metadata` para reflexão de tipos e parâmetros de construtores em tempo de compilação/execução.
- Suporte a 3 escopos de Injeção:
  - **DEFAULT / SINGLETON**: Uma única instância para toda a aplicação.
  - **SCOPED**: Uma instância criada por ciclo de vida de execução de comando/interação.
  - **TRANSIENT**: Uma nova instância criada a cada injeção.

### 3. Estrutura de Build Dual (ESM & CommonJS)

- Builds rápidos utilizando `tsup` (esbuild) gerando saídas `.js` (CJS) e `.mjs` (ESM) juntamente com arquivos de declaração de tipos `.d.ts`.

## Consequências

- **Positivas**:
  - Arquitetura limpa com separação rigorosa de responsabilidades.
  - Possibilidade de reutilizar módulos e serviços sem acoplamento a bibliotecas externas.
  - Execução rápida de testes e builds otimizados pelo cache do Turborepo.
- **Negativas / Riscos**:
  - Exige suporte ao `experimentalDecorators` e `emitDecoratorMetadata` do TypeScript.
