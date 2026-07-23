# Referência da API @shardix/testing

Referência da API do framework de testes e camada de simulação do Shardix.

---

## `createTestingApplication`

```typescript
function createTestingApplication(options?: TestingApplicationOptions): Promise<TestingApplication>;
```

---

## `mockInteraction`

```typescript
function mockInteraction(options: {
  command?: string;
  customId?: string;
  type?: number;
  userId?: string;
  guildId?: string;
  data?: any;
}): InteractionPayload;
```
