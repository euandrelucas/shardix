# ADR 0024: Pipeline de CI/CD e Publicação Automatizada no npm com Changesets

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe DevOps Shardix

## Contexto

Um monorepo corporativo com 26+ pacotes sob a organização `@shardix/*` necessita de um sistema de versionamento automatizado, livre de intervenções manuais propensas a falhas humanas, e com changelogs auditáveis.

## Decisões Arquiteturais

### 1. Ferramenta `@changesets/cli`
- Todo PR contendo alterações em pacotes publicáveis deve incluir um arquivo `.changeset/*.md` descrevendo o tipo de alteração (patch, minor, major) e os pacotes afetados.

### 2. Workflows no GitHub Actions
- `ci.yml`: Validação automática de integridade (Build no Turborepo e Testes no Vitest) para todas as contribuições na branch `main` e PRs.
- `release.yml`: Integração com `changesets/action` para criar Pull Requests de release automáticos e publicar no registro do npm usando `NPM_TOKEN`.

## Consequências

- Versionamento SemVer 100% consistente em todo o ecossistema Shardix.
