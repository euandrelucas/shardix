# ADR 0002: Abstração de Transportes (Transports) e Adaptadores (Adapters)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A comunicação com o Discord pode ocorrer via duas vias distintas:
1. **Gateway WebSocket**: Conexão bidirecional mantida por sharding, recebendo eventos contínuos em tempo real.
2. **HTTP Interactions**: Servidor Web HTTP recebendo requisições POST com payloads de interações (Slash commands, Buttons, Modals, Autocomplete) validados por chave pública via assinatura **ed25519**.

Além disso, a comunidade utiliza bibliotecas distintas para conectar ao Gateway (e.g., `discord.js`, `Eris`, `Discordeno`).

Para atingir **Zero Vendor Lock-in** e tratar **HTTP Interactions como Cidadão de Primeira Classe**, o Shardix precisa desacoplar completamente o core da aplicação da forma como as mensagens e interações chegam.

## Decisões Arquiteturais

### 1. Camada de Adaptador (`DiscordAdapter`)

Definição de uma interface unificada `DiscordAdapter`:

```typescript
export interface DiscordAdapter<TClient = any> {
  readonly name: string;
  getClient(): TClient;
  login(token: string): Promise<void>;
  destroy(): Promise<void>;
  registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void;
  emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void>;
}
```

O `@shardix/core` e os controllers interagem com abstrações unificadas de eventos e comandos, delegando o parsing e envio de respostas ao Adapter configurado (por exemplo, `@shardix/discordjs`).

### 2. Camada de Transporte (`Transport`)

Definição da interface `Transport`:

```typescript
export interface Transport {
  readonly name: string;
  listen(handler: InteractionHandler): Promise<void>;
  close(): Promise<void>;
}
```

Implementações oficiais fornecidas por `@shardix/transport`:
- **`GatewayTransport`**: Utiliza o `DiscordAdapter` para escutar e emitir eventos oriundos do WebSocket do Discord.
- **`HttpInteractionsTransport`**: Levanta um servidor Fastify integrado no pacote `@shardix/http`, realizando validação nativa de assinatura criptográfica ed25519 e convertendo requisições HTTP POST em interações executadas de maneira síncrona/assíncrona pelo router da aplicação.
- **`HybridTransport`**: Permite rodar Gateway para captura de eventos específicos e HTTP Interactions para resposta ultra-rápida a comandos slash e componentes.

## Consequências

- Transparência total para o desenvolvedor: um mesmo `@SlashCommand()` funcionará exatamente da mesma forma se o bot for configurado para `GatewayTransport`, `HttpInteractionsTransport` ou ambos.
- Desativação completa de WebSockets e redução expressiva de consumo de memória/CPU ao escolher `HttpInteractionsTransport`.
