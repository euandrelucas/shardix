# Shardix CLI 2.0 & Project Generator

The official **Shardix CLI** (`@shardix/cli`) provides a complete suite for project generation, development hot-reloading, diagnostics, benchmarks, and migrations.

---

## ⚡ Installation & Commands

```bash
npm install -g @shardix/cli
```

### Available Commands

| Command | Description |
| :--- | :--- |
| `shardix new <name>` | Interactive project generator creating all files in disk |
| `shardix dev` | Development server with hot-reloading and colorized logs |
| `shardix generate <type> <name>` | Component generator (`controller`, `provider`, `service`, `guard`) |
| `shardix benchmark` | Stress test suite measuring IoC, reflection, and dispatch latency |
| `shardix doctor` | Environment diagnostics for Node.js, cluster runtime, and health probes |
| `shardix migrate` | Automatic migration checker for framework version updates |
| `shardix info` | Environment and framework version summary |
