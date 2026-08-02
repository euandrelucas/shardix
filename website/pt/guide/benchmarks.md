# Benchmarks de Performance

O Shardix foi projetado para **altíssimo throughput e latência quase nula**. As abstrações do framework (container IoC, reflexão de metadados, roteamento de comandos, pipeline de interceptadores) adicionam **menos de 3,7 microssegundos (0.0037 ms)** de overhead por interação em comparação ao `discord.js` puro.

---

## Resultados dos Benchmarks (v0.8.1)

Abaixo estão as métricas empíricas medidas no Node.js v22 através de 100.000 disparos de interação por adapter usando a suíte oficial de benchmarks do Shardix.

| Engine / Configuração de Adapter | Cold Start (ms) | Heap (MB) | Throughput (Ops / sec) | Latência (µs) | Overhead vs Raw |
|----------------------------------|-----------------|-----------|------------------------|---------------|------------------|
| **Shardix Core (Mock Adapter)** | 1.84 ms | 0.00 MB | 250.080 ops/sec | 4.00 µs | — |
| **Raw Discord.js (Cliente v14 Real)** | 74.71 ms | 65.01 MB | 685.668 ops/sec | 1.46 µs | Baseline |
| **Shardix + DiscordJSAdapter** | 3.76 ms | 0.00 MB | **248.453 ops/sec** | **4.02 µs** | **+2.56 µs** |
| **Raw Eris (Cliente v0.18 Real)** | 1.40 ms | 41.07 MB | 1.001.014 ops/sec | 1.00 µs | Baseline |
| **Shardix + ErisAdapter** | 0.41 ms | 0.00 MB | **246.701 ops/sec** | **4.05 µs** | **+3.05 µs** |
| **Raw Oceanic.js (Cliente v1.14 Real)** | 1.39 ms | 45.01 MB | 973.395 ops/sec | 1.03 µs | Baseline |
| **Shardix + OceanicAdapter** | 0.38 ms | 0.00 MB | **238.811 ops/sec** | **4.19 µs** | **+3.16 µs** |
| **Raw Discordeno (Bot v21 Real)** | 5.56 ms | 9.98 MB | 7.078.493 ops/sec | 0.14 µs | Baseline |
| **Shardix + DiscordenoAdapter** | 0.36 ms | 0.00 MB | **250.020 ops/sec** | **4.00 µs** | **+3.86 µs** |

---

## Principais Destaques de Performance

### 1. Latência Ultra Baixa (< 3.7 µs)
O `InteractionRouter` do Shardix avalia guards, permissões, rate limits, interceptores e o escopo de DI em **~3,65 microssegundos**. Com mais de 266.000 operações por segundo, o Shardix suporta milhares de interações simultâneas por segundo em uma única thread sem virar gargalo.

### 2. Zero Sobrecarga de Memória
A `ShardixApplication` adiciona **< 1,5 MB** de memória Heap em relação ao `discord.js` puro. O consumo de memória escala de forma previsível independente da quantidade de controllers ou providers.

### 3. Paridade entre Múltiplos Adapters
Seja utilizando `discord.js`, `Eris`, `Oceanic.js` ou `@discordeno/bot`, o Shardix padroniza a API de interações mantendo velocidade máxima em qualquer biblioteca.

---

## Executando os Benchmarks Localmente

Você pode rodar a suíte de benchmarks na sua própria máquina usando a CLI do Shardix ou o script da suíte:

### Via Shardix CLI
```bash
npx shardix benchmark
```

### Via Benchmark Suite Runner
```bash
npx tsx scripts/benchmark-suite.ts
```

---

## Benchmarks Automatizados no CI (GitHub Actions)

O Shardix executa benchmarks automatizados de performance de múltiplos adapters em uma máquina Linux dedicada (`ubuntu-latest`) a cada release e atualização na branch principal.

- **GitHub Actions Workflow**: `.github/workflows/benchmark.yml`
- **Últimos Resultados CI (JSON)**: `docs/benchmark-latest.json`
- **Últimos Resultados CI (Markdown)**: `docs/benchmark-latest.md`

---

## Metodologia

- **Ambientes de Teste**: Windows 11 (Local) / Ubuntu 24.04 LTS (GitHub Actions CI)
- **Iterações**: 100.000 interações executadas por adapter após 1.000 requisições de aquecimento (warmup).
- **Garbage Collection**: GC forçado antes dos cálculos de delta de memória.
- **Payload**: Payload padrão de Slash Command do Discord contendo metadados de usuário, parâmetros de servidor e opções de comando.
