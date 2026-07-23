# Framework de Testes & Camada de Simulação

Execute testes unitários e de integração isolados e ultra-rápidos sem requisições de rede utilizando `@shardix/testing`.

---

## 🧪 Testes de Unidade

```typescript
import { createTestingApplication, mockInteraction } from '@shardix/testing';
import { PingController } from './ping.controller';

describe('PingController', () => {
  it('responde ao comando /ping', async () => {
    const { executeInteraction } = await createTestingApplication({
      controllers: [PingController],
    });

    const res = await executeInteraction(mockInteraction({ command: 'ping' }));
    expect(res.data.content).toContain('Pong');
  });
});
```
