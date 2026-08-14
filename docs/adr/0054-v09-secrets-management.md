# ADR-0054: Secrets Management and Audit Architecture

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, secrets, security, vault, aws-secrets, encryption

## Context

Discord bots and enterprise framework applications require access to sensitive credentials, including Discord bot tokens, database passwords, API keys, OAuth client secrets, and encryption keys. Storing secrets in plain environment variables or hardcoded configuration files poses severe security risks, such as accidental log leaks, memory snapshot exposures, or unencrypted storage in source control.

Shardix v0.9 introduces a secure, unified secrets management framework integrated into the IoC container via the `@Secret()` decorator and `SecretsProvider`.

## Decision

We will implement a secure secrets provider architecture with pluggable backends, parameter injection, secret masking, rotation support, and automated access auditing.

Core Principles & Features:
1. **Security Guarantees**: Secrets are never logged to console or files, never included in state snapshots, never exposed in dashboard API endpoints, and lazy-loaded on demand.
2. **Declarative Parameter Injection**: `@Secret('KEY_NAME')` decorator injects secret values directly into constructor parameters or provider methods.
3. **Pluggable Drivers**:
   - `EnvDriver` (default): Loads secrets from environment variables with runtime masking wrappers.
   - `EncryptedFileDriver`: Decrypts AES-256-GCM encrypted local secret files using a master key stored in environment.
   - `VaultDriver`: Integrates with HashiCorp Vault HTTP API for dynamic secret fetching and lease management.
   - `AWSSecretsDriver`: Integration interface stub for AWS Secrets Manager.
4. **Secret Rotation Support**: Optional TTL settings per secret with automatic background refresh callbacks.
5. **Access Audit Logging**: Every secret retrieval emits a structured audit log entry recording the secret key name, target component, and timestamp (strictly masking the secret value).

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix IoC Dependency Injection             |
 |            constructor(@Secret('DISCORD_TOKEN') token)          |
 +--------------------------------+--------------------------------+
                                  |
                                  v
 +-----------------------------------------------------------------+
 |                         SecretsProvider                         |
 |  +-----------------------------------------------------------+  |
 |  |                    Driver Abstraction                     |  |
 |  |  EnvDriver | EncryptedFileDriver | VaultDriver | AWS      |  |
 |  +------------------------------+----------------------------+  |
 +--------------------------------+--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
 +--------------------+                       +--------------------+
 | Secure Memory Seal |                       | Audit Logger Bus   |
 | (Masked Secret V)  |                       | (Key + Timestamp)  |
 +--------------------+                       +--------------------+
```

### Code Example: Injecting Secrets via `@Secret()`

```typescript
import { Injectable } from '@shardix/core';
import { Secret } from '@shardix/core';

@Injectable()
export class DiscordBotService {
  constructor(
    @Secret('DISCORD_BOT_TOKEN') private readonly botToken: string,
    @Secret('DATABASE_URL') private readonly dbUrl: string
  ) {}

  public getMaskedToken(): string {
    // Secret values are automatically wrapped to prevent accidental string dumping
    return `${this.botToken.substring(0, 5)}...`;
  }
}
```

### Driver Interface & Audit Log Enforcement

```typescript
export interface SecretDriver {
  getSecret(key: string): Promise<string | null>;
}

export class SecretsProvider {
  constructor(
    private readonly driver: SecretDriver,
    private readonly auditLogger: AuditLogger
  ) {}

  public async get(key: string, requester: string): Promise<string> {
    // Record audit event before returning value
    this.auditLogger.logAccess({
      secretKey: key,
      requestedBy: requester,
      timestamp: new Date().toISOString(),
    });

    const value = await this.driver.getSecret(key);
    if (!value) {
      throw new Error(`Secret '${key}' could not be resolved by SecretsProvider.`);
    }

    return value;
  }
}
```

### Audit Log Output Example

```json
{
  "level": "AUDIT",
  "timestamp": "2026-08-04T12:00:00.000Z",
  "event": "SECRET_ACCESSED",
  "secretKey": "DISCORD_BOT_TOKEN",
  "requestedBy": "DiscordBotService",
  "valueMasked": "********************"
}
```

## Consequences

### Positive
- Strict security isolation prevents secret leakage in application logs or crash dumps.
- Seamless integration with enterprise Vault infrastructure via `VaultDriver`.
- Access audit logs fulfill enterprise compliance and security verification requirements.
- Developer ergonomic simplicity using the `@Secret()` injection decorator.

### Negative / Trade-offs
- Integration with external secret stores (Vault, AWS Secrets Manager) adds network latency during application startup.
- Requires careful handling to ensure developers do not explicitly call `console.log(secret)` in application code.

## Implementation Notes

- Added to `@shardix/core` with drivers provided in `@shardix/core` or specialized provider packages.
- Integrates with `reflect-metadata` parameter injection pipeline during container instantiation.

## References
- [ADR-0008: Provider Architecture](0008-provider-architecture.md)
- [ADR-0022: Dashboard Security Model](0022-dashboard-security-model.md)
