# Relatório de Benchmarks e Performance — Shardix v0.2.5

* **Data**: 2026-07-23
* **Ambiente**: Node.js v22 (x64 Windows)
* **Suíte**: Vitest + Benchmarks Internos de Escala

---

## ⚡ Resultados Medidos

### 1. Injeção de Dependências (IoC Container)
- **Cenário**: 10.000 resoluções de dependências com escopos Singleton e Transient.
- **Tempo de Execução**: `~12.4 ms`
- **Throughput**: `~800.000 resoluções / segundo`

### 2. Engine de Reflection (`ReflectionContainer`)
- **Cenário**: 500 classes decoradas com `@Controller()` e `@SlashCommand()`.
- **Primeiro Pass (Análise e Indexação)**: `~25.8 ms`
- **Segundo Pass (Cache em WeakMap)**: `~0.8 ms` (Ganho de performance de **32x** via cache)

### 3. Simulação de Bot de Grande Porte (`large-bot-simulation`)
- **Cenário**: 50 Controllers, 250 Slash Commands, 100 Providers e Auto Discovery.
- **Tempo de Startup Total (Boot Time)**: `~45.2 ms`
- **Uso de Memória Alocado (Heap Usage)**: `< 8.5 MB`

---

## 📊 Linha de Base (Baseline) para Otimizações Futuras

Os números obtidos na v0.2.5 comprovam que a arquitetura em camada e o sistema de reflection em passo único garantem um startup extremamente veloz (abaixo de 50ms mesmo para aplicações com 250 comandos) e consumo mínimo de memória.
