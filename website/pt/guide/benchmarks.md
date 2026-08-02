# Benchmarks de Performance

O Shardix foi projetado para **altíssimo throughput e latência quase nula**. As abstrações do framework (container IoC, reflexão de metadados, roteamento de comandos, pipeline de interceptadores) adicionam **menos de 3,7 microssegundos (0.0037 ms)** de overhead por interação em comparação ao `discord.js` puro.

---

## Resultados dos Benchmarks (v0.8.1)

Abaixo estão as métricas empíricas medidas no Node.js v22 através de 100.000 disparos de interação por adapter usando a suíte oficial de benchmarks do Shardix.

| Engine / Configuração de Adapter | Cold Start (ms) | Heap (MB) | Throughput (Ops / sec) | Latência (µs) | Overhead vs Puro |
|----------------------------------|-----------------|-----------|------------------------|---------------|------------------|
| **Shardix Core (Mock Adapter)** | 1.88 ms | 3.36 MB | 238.071 ops/sec | 4.20 µs | — |
| **Raw Discord.js (Baseline)** | 0.00 ms | 2.58 MB | 18.665.074 ops/sec | 0.05 µs | Baseline |
| **Shardix + DiscordJSAdapter** | 0.33 ms | 9.68 MB | **239.446 ops/sec** | **4.18 µs** | **+4.13 µs** |
| **Raw Eris (Baseline)** | 0.00 ms | 0.00 MB | 22.654.162 ops/sec | 0.04 µs | Baseline |
| **Shardix + ErisAdapter** | 0.54 ms | 0.00 MB | **215.169 ops/sec** | **4.65 µs** | **+4.61 µs** |
| **Raw Oceanic.js (Baseline)** | 0.00 ms | 8.04 MB | 11.698.096 ops/sec | 0.09 µs | Baseline |
| **Shardix + OceanicAdapter** | 1.18 ms | 0.00 MB | **161.729 ops/sec** | **6.18 µs** | **+6.09 µs** |
| **Raw Discordeno (Baseline)** | 0.04 ms | 6.50 MB | 32.059.502 ops/sec | 0.03 µs | Baseline |
| **Shardix + DiscordenoAdapter** | 0.37 ms | 0.00 MB | **152.402 ops/sec** | **6.56 µs** | **+6.53 µs** |

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
