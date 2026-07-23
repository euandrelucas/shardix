# @shardix/plugin

> Official Plugin System and Extension Architecture for **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/plugin
```

## Creating a Plugin

```typescript
import { ShardixPlugin } from '@shardix/plugin';

export class EconomyPlugin implements ShardixPlugin {
  public readonly name = 'EconomyPlugin';
  public readonly version = '1.0.0';

  register(app: any) {
    console.log('⚡ Economy Plugin registered!');
  }
}
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
