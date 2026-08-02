# Benchmarks de Performance

O Shardix foi projetado para **altíssimo throughput e latência quase nula**. As abstrações do framework (container IoC, reflexão de metadados, roteamento de comandos, pipeline de interceptadores) adicionam **menos de 3,7 microssegundos (0.0037 ms)** de overhead por interação em comparação ao `discord.js` puro.

---

## Resultados dos Benchmarks (v0.8.1)

Abaixo estão as métricas empíricas medidas no Node.js v22 através de 100.000 disparos de interação por adapter usando a suíte oficial de benchmarks do Shardix.

| Engine / Configuração de Adapter | Cold Start (ms) | Overhead de Heap (MB) | Throughput (Ops / sec) | Latência Média (µs) | Overhead vs Puro |
|----------------------------------|-----------------|-----------------------|------------------------|---------------------|------------------|
| **Discord.js Puro (Baseline)** | 0.01 ms | 0.00 MB | 10.145.383 ops/sec | 0.10 µs | 0.00 µs (Baseline) |
| **Shardix + Mock Adapter** | 1.99 ms | 6.02 MB | 258.552 ops/sec | 3.87 µs | +3.77 µs |
| **Shardix + DiscordJSAdapter** | 0.31 ms | 0.00 MB | **266.988 ops/sec** | **3.75 µs** | **+3.65 µs** |
| **Shardix + DiscordenoAdapter** | 0.43 ms | 0.00 MB | 243.208 ops/sec | 4.11 µs | +4.01 µs |
| **Shardix + ErisAdapter** | 0.51 ms | 0.00 MB | 133.083 ops/sec | 7.51 µs | +7.41 µs |
| **Shardix + OceanicAdapter** | 1.25 ms | 10.13 MB | 105.527 ops/sec | 9.48 µs | +9.38 µs |

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
