---
title: Performance Benchmarks
description: Real-world performance benchmarks comparing Shardix adapters against raw Discord library baselines across throughput, latency, memory, and concurrency.
---

<script setup>
import { data } from '../.vitepress/benchmark.data.ts'
</script>

# ⚡ Performance Benchmarks

Shardix is engineered for **ultra-high throughput and near-zero overhead**. The framework's IoC container, metadata reflection, route matching, guard pipeline, and DI scope resolution add **less than 4 microseconds (0.004 ms)** of overhead per interaction over raw library baselines.

> [!IMPORTANT]
> All benchmarks run **real installed library instances** — not mocks or stubs. Each test simulates a realistic bot lifecycle:
> 1. Instantiate the client/bot with real options
> 2. Register 3 command handlers (`/ping`, `/heavy`, `/echo`)
> 3. Simulate the `IDENTIFY → READY → GUILD_CREATE` gateway handshake
> 4. Warm up with 1,000 interactions
> 5. Measure 100,000 sequential dispatches → p50/p95/p99 latency
> 6. Measure 10,000 concurrent dispatches (100 parallel × 100 rounds)
> 7. Graceful teardown

---

## Live Benchmark Results

<BenchmarkCharts :payload="data" />

---

## Running Benchmarks Locally

```bash
# Run and display in terminal
npx tsx scripts/benchmark-suite.ts

# Run and save results to docs/benchmark-latest.json
npx tsx scripts/benchmark-suite.ts --save

# Output raw JSON (useful for CI piping)
npx tsx scripts/benchmark-suite.ts --json
```

---

## Automated CI Benchmarks

Shardix runs automated benchmarks on every push to `main` and every release via GitHub Actions. Results are committed back to the repo and automatically appear on this page.

- **Workflow**: [`.github/workflows/benchmark.yml`](https://github.com/euandrelucas/shardix/blob/main/.github/workflows/benchmark.yml)
- **Raw JSON**: [`docs/benchmark-latest.json`](https://github.com/euandrelucas/shardix/blob/main/docs/benchmark-latest.json)

---

## Methodology

| Factor | Details |
|--------|---------|
| **Environment** | Ubuntu 24.04 LTS (CI) / Windows 11 (local dev) |
| **Node.js** | v22 LTS |
| **Libraries** | discord.js v14, eris v0.18, oceanic.js v1.14, @discordeno/bot v21 |
| **Sequential runs** | 100,000 dispatches after 1,000 warmup iterations |
| **Concurrent runs** | 100 parallel interactions × 100 rounds (10,000 total) |
| **Percentiles** | p50 (median), p95, p99 from 100K sample array |
| **Memory** | RSS delta from `process.memoryUsage()` at steady state |
| **GC** | `global.gc()` forced before each test when `--expose-gc` is active |
| **Payload** | Standard Discord slash command with options, guild & channel IDs |
