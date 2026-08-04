---
title: Benchmarks de Performance
description: Benchmarks reais comparando os adapters Shardix com baselines crus de bibliotecas Discord, cobrindo throughput, latência, memória e concorrência.
---

<script setup>
import { data } from '../../.vitepress/benchmark.data.ts'
</script>

# ⚡ Benchmarks de Performance

O Shardix é projetado para **throughput ultra-alto e overhead praticamente zero**. O container IoC, reflexão de metadados, roteamento, pipeline de guards e resolução de escopo DI adicionam **menos de 4 microsegundos (0,004 ms)** de overhead por interação em relação às bibliotecas curas.

> [!IMPORTANT]
> Todos os benchmarks usam **instâncias reais das bibliotecas instaladas** — sem mocks ou stubs. Cada teste simula um ciclo de vida realista de bot:
> 1. Instanciar o client/bot com opções reais
> 2. Registrar 3 handlers de comando (`/ping`, `/heavy`, `/echo`)
> 3. Simular a sequência de gateway `IDENTIFY → READY → GUILD_CREATE`
> 4. Aquecer com 1.000 interações
> 5. Medir 100.000 dispatches sequenciais → latência p50/p95/p99
> 6. Medir 10.000 dispatches concorrentes (100 paralelos × 100 rodadas)
> 7. Teardown gracioso

---

## Resultados ao Vivo

<BenchmarkCharts :payload="data" />

---

## Rodando Localmente

```bash
# Rodar e exibir no terminal
npx tsx scripts/benchmark-suite.ts

# Rodar e salvar resultados em docs/benchmark-latest.json
npx tsx scripts/benchmark-suite.ts --save

# Saída JSON bruta (útil para CI)
npx tsx scripts/benchmark-suite.ts --json
```

---

## CI Automatizado

O Shardix executa benchmarks automáticos a cada push na `main` e em cada release via GitHub Actions. Os resultados são commitados de volta ao repositório e aparecem automaticamente nesta página.

- **Workflow**: [`.github/workflows/benchmark.yml`](https://github.com/euandrelucas/shardix/blob/main/.github/workflows/benchmark.yml)
- **JSON Bruto**: [`docs/benchmark-latest.json`](https://github.com/euandrelucas/shardix/blob/main/docs/benchmark-latest.json)

---

## Metodologia

| Fator | Detalhes |
|-------|---------|
| **Ambiente** | Ubuntu 24.04 LTS (CI) / Windows 11 (dev local) |
| **Node.js** | v22 LTS |
| **Bibliotecas** | discord.js v14, eris v0.18, oceanic.js v1.14, @discordeno/bot v21 |
| **Sequencial** | 100.000 dispatches após 1.000 iterações de aquecimento |
| **Concorrente** | 100 interações paralelas × 100 rodadas (10.000 no total) |
| **Percentis** | p50 (mediana), p95, p99 a partir de 100K amostras |
| **Memória** | Delta de RSS via `process.memoryUsage()` em steady state |
| **GC** | `global.gc()` forçado antes de cada teste |
| **Payload** | Slash command Discord padrão com opções, guild ID e channel ID |
