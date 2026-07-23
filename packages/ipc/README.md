# @shardix/ipc

> Internal communication layer (Local IPC & Redis Pub/Sub) for **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/ipc
```

## Usage

```typescript
import { LocalIPCTransport } from '@shardix/ipc';

const ipc = new LocalIPCTransport();
ipc.subscribe('user:levelup', (data) => console.log('Event:', data));
await ipc.broadcast('user:levelup', { userId: '123' });
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
