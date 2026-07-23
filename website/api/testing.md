# @shardix/testing API Reference

API reference for the official Shardix Testing framework and Mock Discord layer.

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
