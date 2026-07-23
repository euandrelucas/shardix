# Testing Framework & Mock Discord Layer

Run isolated unit and integration tests without network requests using `@shardix/testing`.

---

## 🧪 Unit Testing

```typescript
import { createTestingApplication, mockInteraction } from '@shardix/testing';
import { PingController } from './ping.controller';

describe('PingController', () => {
  it('handles /ping command', async () => {
    const { executeInteraction } = await createTestingApplication({
      controllers: [PingController],
    });

    const res = await executeInteraction(mockInteraction({ command: 'ping' }));
    expect(res.data.content).toContain('Pong');
  });
});
```
