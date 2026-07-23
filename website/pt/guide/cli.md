# Shardix CLI 2.0 & Gerador de Projetos

A **Shardix CLI** oficial (`@shardix/cli`) oferece uma suíte completa para geração de projetos, desenvolvimento local com hot-reloading, diagnósticos, benchmarks e migrações.

---

## ⚡ Instalação e Comandos

```bash
npm install -g @shardix/cli
```

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `shardix new <nome>` | Gerador interativo de projetos com escrita física no disco |
| `shardix dev` | Servidor de desenvolvimento com hot-reloading e logs coloridos |
| `shardix generate <tipo> <nome>` | Gerador de componentes (`controller`, `provider`, `service`, `guard`) |
| `shardix benchmark` | Suíte de estresse medindo IoC, reflection e latência |
| `shardix doctor` | Diagnóstico de ambiente para Node.js, cluster e probes de saúde |
| `shardix migrate` | Verificador de migração automática para novas versões |
| `shardix info` | Resumo de ambiente e versões do framework |
