# Referência da API @shardix/plugin

Referência da API oficial do sistema de plugins do Shardix.

---

## `ShardixPlugin`

```typescript
interface ShardixPlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  register(app: any): Promise<void> | void;
  onInit?(app: any): Promise<void> | void;
  onShutdown?(app: any): Promise<void> | void;
}
```

---

## `PluginManager`

```typescript
class PluginManager {
  register(plugin: ShardixPlugin): void;
  initAll(app: any): Promise<void>;
  shutdownAll(app: any): Promise<void>;
  getPlugins(): ShardixPlugin[];
}
```
