# ADR 0010: Resolução de Dependências de Providers

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Um Provider pode depender de outro (ex: `CacheProvider` ou `EventBusProvider` podem depender do `LoggerProvider`). A ordem de inicialização deve ser resolvida automaticamente sem exigir ordenação manual.

## Decisões Arquiteturais

### 1. Decorator `@DependsOn()`

```typescript
@DependsOn(LoggerProvider)
export class CacheProvider implements ProviderContract { ... }
```

### 2. Ordenação Topológica via Algoritmo de Kahn
- O `ProviderManager` analisa o grafo de dependências via `@DependsOn`.
- Realiza a ordenação topológica e detecta dependências circulares lançando erro explícito durante a fase de registro.

## Consequências

- Garantia de que dependências são registradas e inicializadas exatamente na ordem necessária.
