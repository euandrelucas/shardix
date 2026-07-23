# Plugin Ecosystem & Extension Architecture

Extend Shardix applications with third-party plugins using `@shardix/plugin`.

---

## 🧩 Creating a Shardix Plugin

```typescript
import { ShardixPlugin } from '@shardix/plugin';

export class ModerationPlugin implements ShardixPlugin {
  public readonly name = 'ModerationPlugin';
  public readonly version = '1.0.0';

  register(app: any) {
    console.log('⚡ Moderation Plugin registered!');
  }
}
```
