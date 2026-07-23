# Ecossistema de Plugins & Arquitetura de Extensão

Estenda aplicações Shardix com plugins de terceiros utilizando `@shardix/plugin`.

---

## 🧩 Criando um Plugin Shardix

```typescript
import { ShardixPlugin } from '@shardix/plugin';

export class ModerationPlugin implements ShardixPlugin {
  public readonly name = 'ModerationPlugin';
  public readonly version = '1.0.0';

  register(app: any) {
    console.log('⚡ Plugin de Moderação registrado!');
  }
}
```
