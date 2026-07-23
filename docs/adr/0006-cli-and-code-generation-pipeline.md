# ADR 0006: Pipeline do CLI e Geradores de Código

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Para acelerar o desenvolvimento e manter a consistência de código entre times, o CLI `create-shardix` deve ser expandido com o subcomando `shardix generate <type> <name>`.

## Decisões Arquiteturais

### Geradores Suportados
- `shardix generate module <name>`
- `shardix generate controller <name>`
- `shardix generate command <name>`
- `shardix generate event <name>`
- `shardix generate guard <name>`
- `shardix generate interceptor <name>`
- `shardix generate provider <name>`
- `shardix generate service <name>`

Cada gerador cria automaticamente o código estruturado, as anotações de decorators adequadas e a suíte de testes unitários associada (`.spec.ts`).

## Consequências

- Padronização total na estrutura dos componentes em projetos Shardix.
