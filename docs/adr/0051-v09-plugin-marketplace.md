# ADR-0051: Plugin Marketplace and Ecosystem (`@shardix/plugins`)

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, plugin, cli, marketplace, hooks

## Context

As the Shardix framework grows, community developers and enterprise teams require standardized extension mechanisms to add features—such as pagination helpers, multi-language internationalization (i18n), audit logging, and custom moderation checks—without polluting core monorepo packages. Earlier plugin concepts (ADR-0026) outlined basic plugin definitions, but lacked CLI registry management, isolation boundaries, plugin manifests, and lifecycle hook contracts.

Shardix v0.9 introduces a comprehensive plugin system powered by `@shardix/plugins` and integrated CLI subcommands for searching, installing, updating, and removing community plugins.

## Decision

We will formalize the Shardix plugin infrastructure with strict manifest contracts, lifecycle hook APIs, controlled isolation, and CLI package search against the npm ecosystem.

Key Specifications:
1. **Plugin Manifest Schema**: Every plugin defines a `shardix-plugin.json` or `package.json` entry declaring metadata, required `shardixVersion` compatibility range, and exposed hook implementations.
2. **Lifecycle Hooks Interface**:
   - `onBoot(appContext)`: Invoked during application initialization.
   - `onCommand(commandContext, next)`: Intercepts command dispatch (middleware pattern).
   - `onEvent(eventContext, next)`: Intercepts gateway and bus event handling.
   - `onShutdown()`: Invoked during graceful application teardown.
3. **Plugin Isolation Boundary**: Plugins do not receive direct access to the internal IoC container instance. Instead, plugins interact strictly through published plugin context APIs and hook parameter objects.
4. **CLI Plugin Management**:
   - `shardix plugin search <query>`: Queries npm registry for `@shardix-plugin/*` packages.
   - `shardix plugin install <name>`: Downloads, installs, and registers plugin in project config.
   - `shardix plugin update [name]`: Updates plugin packages to latest compatible versions.
   - `shardix plugin remove <name>`: Uninstalls package and removes registration metadata.
   - `shardix plugin list`: Lists all currently active plugins in the local project.
5. **Official Plugin Suite**: Launch three foundational official plugins:
   - `@shardix-plugin/pagination`: Interactive button/select-menu pagination helper.
   - `@shardix-plugin/i18n`: Locale detection and string localization system.
   - `@shardix-plugin/audit-log`: Automated command execution & admin action auditing.

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix CLI (`shardix plugin`)              |
 |      `search` | `install` | `update` | `remove` | `list`        |
 +--------------------------------+--------------------------------+
                                  |
                                  v
 +-----------------------------------------------------------------+
 |                     npm Package Registry                        |
 |                (Packages matching @shardix-plugin/*)            |
 +--------------------------------+--------------------------------+
                                  |
                                  v
 +-----------------------------------------------------------------+
 |                    Plugin Execution Runtime                     |
 |                      (@shardix/plugins)                         |
 |  +-----------------------------------------------------------+  |
 |  |                    Plugin Context Boundary                |  |
 |  |   +-------------------+           +-------------------+   |  |
 |  |   |  onBoot / Shutdown|           | onCommand / Event |   |  |
 |  |   +---------+---------+           +---------+---------+   |  |
 |  +-------------|-------------------------------|-------------+  |
 +----------------|-------------------------------+----------------+
                  v                               v
     +-------------------------+     +-------------------------+
     | Core Application Boot   |     | Command / Event Bus     |
     +-------------------------+     +-------------------------+
```

### Plugin Manifest Example (`package.json` format)

```json
{
  "name": "@shardix-plugin/pagination",
  "version": "1.0.0",
  "description": "Interactive pagination plugin for Shardix Discord bots",
  "shardix": {
    "plugin": true,
    "shardixVersion": "^0.9.0",
    "main": "./dist/index.js"
  }
}
```

### Plugin Implementation Example

```typescript
import { ShardixPlugin, PluginContext, CommandContext, NextFunction } from '@shardix/plugins';

export class PaginationPlugin implements ShardixPlugin {
  public readonly name = '@shardix-plugin/pagination';
  public readonly version = '1.0.0';

  async onBoot(context: PluginContext): Promise<void> {
    context.logger.info('PaginationPlugin initialized successfully');
  }

  async onCommand(ctx: CommandContext, next: NextFunction): Promise<void> {
    // Intercept command execution to attach pagination helpers to context
    ctx.state.paginate = (items: any[], pageSize = 10) => {
      return { page: 1, totalPages: Math.ceil(items.length / pageSize), items: items.slice(0, pageSize) };
    };
    await next();
  }

  async onShutdown(): Promise<void> {
    // Teardown plugin resources
  }
}
```

## Consequences

### Positive
- Ecosystem growth: Enables third-party developers to publish modular extensions to npm.
- Security and stability: Strict plugin context isolation prevents plugins from mutating private container internals.
- Ease of management: CLI tools automate plugin installation and project file registration.

### Negative / Trade-offs
- Middleware execution hooks (`onCommand`, `onEvent`) introduce minor invocation latency if many plugins are chain-registered.
- Reliance on npm registry search requires internet connectivity for `shardix plugin search`.

## Implementation Notes

- Main package: `@shardix/plugins`.
- CLI commands implemented under `packages/cli/src/commands/plugin/`.
- Official plugins hosted under `packages/plugins/` monorepo workspace directory during initial rollout.

## References
- [ADR-0006: CLI and Code Generation Pipeline](0006-cli-and-code-generation-pipeline.md)
- [ADR-0026: Plugin System](0026-plugin-system.md)
