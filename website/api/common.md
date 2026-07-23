# @shardix/common Reference

Public interfaces and decorators exported by Shardix.

## Decorators

- `@Controller()`: Marks a class as a Shardix Controller.
- `@SlashCommand({ name, description })`: Registers a Discord slash command interaction handler.
- `@Injectable()`: Marks a class for automatic dependency injection.
- `@DependsOn(...providers)`: Specifies provider initialization dependencies.
