# @shardix/storage

## 0.10.0

### Minor Changes

- e71bb18: feat: Shardix v0.9 — Production Platform

  Transform Shardix from a Discord framework into a full production platform for enterprise bots.

  ## New Packages
  - `@shardix/scheduler` — `@Cron`, `@Interval`, `@Timeout` decorators with a pure Node.js cron parser, `SchedulerRegistry` for runtime control, and graceful shutdown
  - `@shardix/storage` — Storage abstraction with `LocalDriver`, `S3Driver` (compatible with Cloudflare R2, MinIO), streaming support, `copy()`, `move()`, and `presign()`

  ## Major Rewrites
  - `@shardix/provider-health` — Full RFC-compliant health check system. Exposes `/health`, `/ready`, `/live`, `/metrics` (Prometheus format) via a zero-dependency HTTP server. K8s and Docker Compose compatible
  - `@shardix/provider-observability` — Real-time metrics: CPU%, event loop delay, p95 command latency, interactions/s, cache hit ratio. Includes `StructuredLogger`, `Tracer` with correlation IDs, and optional WebSocket push server (port 9090)
  - `@shardix/provider-queue` — Production queue with delay, priority, exponential backoff, dead letter queue, and `@QueueProcessor` decorator
  - `@shardix/provider-eventbus` — Event Bus with wildcard (`*`) and pattern (`user.*`) subscriptions, concurrent emit, and Redis driver interface
  - `@shardix/dashboard-api` — Real metrics backend with WebSocket push, CORS, 10+ REST endpoints, and embedded minimal dashboard UI

  ## CLI Additions (`@shardix/cli`)
  - `shardix profile` — Performance profiler with `--watch`, `--top N`, `--export` flags
  - `shardix audit` — Production readiness audit with scored report (checks env, tsconfig, hardcoded tokens, health provider, etc.)
  - `shardix deploy` — Generates deployment artifacts for Docker, Kubernetes, Railway, Fly.io, and GitHub Actions

  ## Architecture
  - 10 new ADRs (0046–0055) covering: Dashboard, Observability, Scheduler, Queue, Storage, Plugin Marketplace, Production Runtime, OpenTelemetry, Secrets Management, and API Stability

  ## Documentation
  - 14 new guide pages (English and Portuguese)
  - Full v0.9 Production Platform section in sidebar

### Patch Changes

- Updated dependencies [e71bb18]
  - @shardix/common@0.8.2
