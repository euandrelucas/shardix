# ADR 0013: Adaptadores Universais de Bibliotecas Discord (Multi-Vendor Adapters)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Um dos princípios fundamentais do Shardix é o **Zero Vendor Lock-in**. O framework de arquitetura não deve acoplar a aplicação do usuário a nenhuma biblioteca específica de comunicação com a API do Discord (como Discord.js, Eris, Oceanic.js ou Discordeno).

## Decisões Arquiteturais

### 1. Interface `DiscordAdapter` (`@shardix/common`)

```typescript
export interface DiscordAdapter {
  readonly name: string;
  readonly version: string;
  login(token: string): Promise<void>;
  destroy(): Promise<void>;
  onInteractionCreate(handler: (interaction: any) => void | Promise<void>): void;
}
```

### 2. Pacotes Oficiais de Adaptadores
- **`@shardix/discordjs`**: Adaptador para a biblioteca Discord.js.
- **`@shardix/eris`**: Adaptador para a biblioteca Eris.
- **`@shardix/oceanicjs`**: Adaptador para a biblioteca Oceanic.js.
- **`@shardix/discordeno`**: Adaptador para a biblioteca Discordeno.

## Consequências

- Mudar de biblioteca Discord exige alterar apenas a instância do Adapter na fábrica `ShardixFactory.create({ adapter: new ErisAdapter(...) })`.
- Controllers, Services, Guards, Interceptors, Runtimes e Providers permanecem 100% inalterados.
