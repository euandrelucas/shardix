# ADR 0004: Sistema de Reflection e Auto Discovery

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A leitura repetida de metadados TypeScript via `Reflect.getMetadata` durante a execução de comandos ou requisições HTTP introduz gargalos de CPU e alocação desnecessária de memória. Além disso, forçar o desenvolvedor a registrar manualmente cada Controller ou Provider em arrays `@Module({ controllers: [...] })` reduz a produtividade e a experiência do desenvolvedor (DX).

## Decisões Arquiteturais

### 1. Engine de Reflection em Passo Único (Single-Pass Reflection)
- A reflexão de uma classe ocorre exatamente **uma vez** durante a inicialização (boot da aplicação).
- Os metadados extraídos são indexados e armazenados em cache imutável usando `WeakMap<object, ProcessedMetadata>` e mapas internos.

### 2. Auto Discovery / Auto Scanner
- O `AutoScanner` realiza a varredura dos módulos e diretórios do projeto durante o bootstrap.
- Identifica automaticamente classes decoradas com `@Controller()`, `@Injectable()`, `@SlashCommand()`, `@Event()`, `@Button()`, etc.
- Registra dinamicamente essas classes no Container IoC e no `InteractionRouter`, tornando o cadastro manual opcional.

## Consequências

- Registro zero-configuração de comandos e eventos.
- Impacto de performance insignificante durante o tempo de execução (runtime lookup em tempo constante O(1)).
