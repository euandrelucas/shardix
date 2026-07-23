# Referência @shardix/core

Pacote principal contendo o container IoC, motor de cache de reflexão, auto scanner e fábrica da aplicação.

## Classes

### `ShardixFactory`
Fábrica para instanciar aplicações Shardix.

```typescript
const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  runtime: new GatewayRuntime(),
});
```

### `AutoScanner`
Varre e registra controllers, módulos e provedores decorados.

```typescript
AutoScanner.scanAndRegister(app, [PingController]);
```
