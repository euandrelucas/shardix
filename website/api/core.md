# @shardix/core Reference

The core framework package containing IoC container, reflection caching engine, auto scanner, and application lifecycle factory.

## Classes

### `ShardixFactory`
Entry point factory to instantiate Shardix Applications.

```typescript
const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  runtime: new GatewayRuntime(),
});
```

### `AutoScanner`
Scans and registers decorated controllers, modules, and providers.

```typescript
AutoScanner.scanAndRegister(app, [PingController]);
```
