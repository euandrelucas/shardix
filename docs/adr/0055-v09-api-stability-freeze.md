# ADR-0055: API Stability Freeze and Semantic Versioning Commitment for v1.0 Roadmap

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, api-freeze, semver, governance, v1.0

## Context

As Shardix approaches its major v1.0 production release, enterprise adopters and community plugin developers require strict guarantees regarding API stability, backward compatibility, and version deprecation timelines. Prior to v0.9, rapid architectural evolution across providers, transports, and CLI tooling resulted in occasional breaking changes between minor versions.

To establish enterprise confidence and guarantee long-term maintainability, Shardix v0.9 enforces an API Stability Freeze, formalizes public vs. internal boundaries, and adopts a strict Semantic Versioning (SemVer 2.0.0) governance policy.

## Decision

We will declare an API Stability Freeze for all public framework interfaces in Shardix v0.9, establishing clear rules for deprecations, versioning, and release documentation leading up to v1.0.

Core Stability Rules:
1. **Public API Boundary Definition**:
   - **Public & Stable (Guaranteed)**: Decorators (`@Injectable`, `@Command`, `@Event`, `@Cron`, `@QueueProcessor`, `@Secret`), core interfaces (`ProviderContract`, `ShardixAdapter`, `StorageDriver`, `QueueDriver`), `ShardixFactory`, and official CLI command inputs/outputs.
   - **Internal Implementation (Subject to change)**: Private metadata keys, internal container injection lookup tables, low-level transport wire protocols, and unexported package utils.
2. **Semantic Versioning Commitment**: Strictly adhere to SemVer 2.0.0. Following the v1.0 release, no breaking changes will occur within minor (`1.x.0`) or patch (`1.0.x`) releases. Breaking changes will only be introduced in major version bumps (`2.0.0`).
3. **Formal Deprecation Policy**: Any API marked for removal must remain functional for a minimum of **2 minor release versions** before total removal.
4. **Runtime Deprecation Warnings**: Deprecated APIs must include `@deprecated` JSDoc tags and emit runtime warnings (`console.warn` / logger warning) upon invocation.
5. **v1.0 API Surface Checklist**: Mandatory API surface review and public type audit prior to tagging `v1.0.0`.
6. **Standardized CHANGELOG Format**: All monorepo packages must conform to the [Keep a Changelog](https://keepachangelog.com/) standard managed via `changesets`.

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix Public API Surface                   |
 |  (@Injectable, @Command, ProviderContract, ShardixFactory)     |
 +--------------------------------+--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
 +--------------------+                       +--------------------+
 | STABLE API CORE    |                       | DEPRECATION ENGINE |
 | (No Breakages in   |                       | (@deprecated JSDoc |
 |  Minor Releases)   |                       | + Runtime Warnings)|
 +--------------------+                       +---------+----------+
                                                        |
                                                        v
                                              +--------------------+
                                              | Removal Policy     |
                                              | (2 Minors Notice)  |
                                              +--------------------+
```

### Code Example: Runtime Deprecation Warning Wrapper

```typescript
/**
 * Wraps a legacy method to log a runtime deprecation warning.
 * @deprecated Use `ShardixFactory.create()` instead. Will be removed in v1.1.0.
 */
export function deprecatedApiWarning(oldName: string, newName: string, removalVersion: string): void {
  const warningMsg = `[Shardix Deprecation Warning]: '${oldName}' is deprecated and will be removed in v${removalVersion}. Please migrate to '${newName}'.`;
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(warningMsg);
  }
}
```

### CHANGELOG Standard Format (`CHANGELOG.md`)

```markdown
# Changelog

All notable changes to `@shardix/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-08-04
### Added
- Secrets management via `@Secret()` decorator and `SecretsProvider`.
- Enhanced queue system with dead letter queue support in `@shardix/provider-queue`.

### Deprecated
- Legacy `app.registerProvider()` signature deprecated in favor of `ProviderContract.boot()`.
```

## Consequences

### Positive
- High developer confidence for enterprise teams building mission-critical bots on Shardix.
- Predictable upgrade paths with clear migration windows provided by the 2-minor-version deprecation policy.
- Standardized documentation and changelogs simplify release management across all monorepo packages.

### Negative / Trade-offs
- Maintaining deprecated APIs across two minor versions increases internal codebase refactoring overhead.
- Requires strict pull request review discipline to ensure internal symbols are not exposed publicly.

## Implementation Notes

- Governance policy applies across all `@shardix/*` monorepo packages.
- API surface check tools (such as `api-extractor`) will be added to continuous integration (CI) workflows.
- Final API review gate must be approved by the core team before tagging `v1.0.0`.

## References
- [ADR-0001: Architecture Overview](0001-architecture-overview-and-monorepo-structure.md)
- [ADR-0024: Release Pipeline and Changesets](0024-release-pipeline-and-changesets.md)
