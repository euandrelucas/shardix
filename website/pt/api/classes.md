# Shardix Framework — Índice Completo de Classes e Referência de API

Índice completo de referência de classes para todos os pacotes da monorepo Shardix.

---

## 🟢 `@shardix/core`

### `ShardixApplication`
Contêiner central da aplicação que orquestra injeção de dependência, runtimes, adaptadores, cliente REST, cache e presença.
- **`rest`**: Instância do `ShardixRestClient` para chamadas REST.
- **`cache`**: Instância do `ShardixCacheManager` para cache de entidades.
- **`presence`**: Instância do `PresenceManager` para atualizações de status.
- **`start()`**: `Promise<void>` — Inicializa provedores, registra módulos, conecta o runtime e o adaptador.
- **`stop(signal?: string)`**: `Promise<void>` — Encerra graciosamente a aplicação e os transportes.

### `ShardixFactory`
Classe utilitária para instanciar a `ShardixApplication`.
- **`ShardixFactory.create(options?: ShardixOptions)`**: `Promise<ShardixApplication>`

### `InteractionRouter`
Roteador interno que combina interações de entrada (comandos slash, botões, modais, selects) com os métodos decorados dos controllers.

### `PresenceManager`
- **`set(options: PresenceOptions)`**: `void` — Define status (`online`, `idle`, `dnd`, `invisible`) e atividades.
- **`getPresence()`**: `PresenceOptions`

### `RateLimitManager`
- **`check(bucketKey: string, limit?: number, windowMs?: number)`**: `{ allowed: boolean; retryAfter: number }`

### `MiddlewarePipeline`
- **`use(middleware: MiddlewareFunction)`**: `this`
- **`execute(req: any, res: any, finalHandler: () => Promise<any>)`**: `Promise<any>`

---

## 🔵 `@shardix/common`

### Contexto e Lógica de Negócio
- **`CommandContext`**: Objeto unificado de contexto da interação (`reply()`, `defer()`, `editReply()`, `followUp()`, `awaitButton()`, `awaitModal()`, `awaitSelect()`).

### Builders Universais
- **`EmbedBuilder`**: Builder fluente de embeds.
- **`ButtonBuilder`**: Builder fluente de botões.
- **`SelectMenuBuilder`**: Builder fluente de menus de seleção.
- **`ModalBuilder`**: Builder fluente de diálogos modais.
- **`PollBuilder`**: Builder fluente de enquetes/pesquisas.
- **`MessageBuilder`**: Builder universal de payloads de mensagem.
- **`ActionRowBuilder`**: Builder de linhas de componentes (ActionRow).
- **`SlashCommandBuilder`**: Builder de comandos Slash.
- **`ContextMenuBuilder`**: Builder de comandos de menu de contexto.
- **`ThreadBuilder`**: Builder de criação de tópicos.
- **`RoleBuilder`**: Builder de configuração de cargos.
- **`AttachmentBuilder`**: Builder de anexos.
- **`PermissionBuilder`**: Builder de permissões por bitfield.

---

## 🟣 `@shardix/plugin` & `@shardix/testing`

### `@shardix/plugin`
- **`PluginManager`**: Gerencia o registro e ciclo de vida de plugins.
- **`ShardixPlugin`**: Interface contratual para plugins de terceiros.

### `@shardix/testing`
- **`createTestingApplication()`**: Instancia ambiente isolado sem rede.
- **`MockDiscordAdapter`**: Adaptador mock com resposta síncrona.
- **`mockInteraction()`**: Gera payloads de interação para testes.

---

## 🟡 `@shardix/cache` & `@shardix/provider-cache`

- **`ShardixCacheManager`**: Gerenciador unificado de cache para Guilds, Canais, Membros, Usuários, Cargos, Emojis, Stickers, Tópicos e Estados de Voz.
- **`MemoryCacheProvider`**: Provedor em memória com suporte a TTL e sweepers.
- **`LRUCacheProvider`**: Provedor com descarte por menos recentemente usado (LRU).
- **`RedisCacheProvider`**: Provedor distribuído baseado em Redis.
