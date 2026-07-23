# Referência @shardix/common

Interfaces públicas e decorators exportados pelo Shardix.

## Decorators

- `@Controller()`: Marca uma classe como Controller do Shardix.
- `@SlashCommand({ name, description })`: Registra um manipulador de interações de comando Slash.
- `@Injectable()`: Marca uma classe para injeção de dependências automática.
- `@DependsOn(...providers)`: Especifica dependências de inicialização de provedores.
