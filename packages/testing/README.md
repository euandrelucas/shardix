# @shardix/testing

> Official Testing Framework and Mock Discord Layer for **Shardix Framework**.

## Installation

```bash
pnpm add -D @shardix/testing
```

## Usage

```typescript
import { createTestingApplication, mockInteraction } from '@shardix/testing';
import { PingController } from './ping.controller';

describe('PingController Test', () => {
  it('should handle /ping interaction', async () => {
    const { executeInteraction } = await createTestingApplication({
      controllers: [PingController],
    });

    const payload = mockInteraction({ command: 'ping' });
    const response = await executeInteraction(payload);

    expect(response.data.content).toContain('Pong');
  });
});
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
