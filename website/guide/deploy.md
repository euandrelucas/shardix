---
title: Deploy Tools & CLI Generator
description: Automated production deployment generator for Shardix Discord bots supporting Docker, Kubernetes, Railway, Fly.io, and GitHub Actions CI/CD workflows.
---

# 🚀 Deploy Tools & CLI

The Shardix CLI (`@shardix/cli`) includes automated deployment generators (`shardix deploy`) that produce optimized, production-ready infrastructure configurations for various container and cloud platforms with zero vendor lock-in.

---

## Overview: What Deploy Tools Generate

Running `shardix deploy` analyzes your project dependencies (whether you use Gateway or HTTP interactions, Redis, S3 storage, cluster workers, or health checks) and automatically scaffolds all required infrastructure files:

- 🐳 **Docker**: Multi-stage, minimal Alpine containers with layer caching and non-root users
- ☸️ **Kubernetes**: Deployments, Services, ConfigMaps, Secrets, and auto-configured readiness/liveness probes
- 🚂 **Railway**: Native Nixpacks configuration, environment variable templates, and health checks
- 🎈 **Fly.io**: Production `fly.toml` with region configurations and persistent volume mounting
- 🐙 **GitHub Actions**: Fully automated CI/CD pipeline running lint, unit tests, Docker builds, and deployment

```bash
# Interactive deployment wizard
shardix deploy

# Direct target generation
shardix deploy --target <docker|k8s|railway|fly|github>
```

---

## 1. `shardix deploy --target docker`

Generates an optimized multi-stage `Dockerfile` and `.dockerignore`.

```bash
shardix deploy --target docker
```

### Generated `Dockerfile`:

```dockerfile
# -------------------------------------------------------------------
# Stage 1: Build & Prune
# -------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm/yarn/npm consistency
RUN corepack enable

COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm ci; \
  fi

COPY . .

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# -------------------------------------------------------------------
# Stage 2: Production Runner
# -------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Security: Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 8080

# Health check integration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ready || exit 1

CMD ["node", "dist/index.js"]
```

---

## 2. `shardix deploy --target k8s`

Generates Kubernetes deployment and service manifests in `k8s/deployment.yaml`.

```bash
shardix deploy --target k8s
```

### Generated `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shardix-bot-deployment
  labels:
    app: shardix-bot
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: shardix-bot
  template:
    metadata:
      labels:
        app: shardix-bot
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: bot
          image: ghcr.io/your-org/shardix-bot:latest
          imagePullPolicy: IfNotPresent
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          ports:
            - containerPort: 8080
              name: http-health
          envFrom:
            - configMapRef:
                name: shardix-config
            - secretRef:
                name: shardix-secrets
          livenessProbe:
            httpGet:
              path: /live
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: shardix-bot-service
spec:
  type: ClusterIP
  selector:
    app: shardix-bot
  ports:
    - port: 8080
      targetPort: 8080
      name: http-probes
```

---

## 3. `shardix deploy --target railway`

Generates `railway.json` and configures automated build commands for Railway.

```bash
shardix deploy --target railway
```

### Step-by-Step Deployment Guide:

1. **Install Railway CLI** (or connect via GitHub):
   ```bash
   npm i -g @railway/cli
   railway login
   ```
2. **Initialize Project**:
   ```bash
   railway init
   ```
3. **Provision Redis & PostgreSQL (Optional)**:
   ```bash
   railway add -d redis
   ```
4. **Set Environment Variables**:
   In the Railway dashboard or via CLI:
   ```bash
   railway variables set DISCORD_TOKEN="your-bot-token"
   ```
5. **Deploy**:
   ```bash
   railway up
   ```

### Generated `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/ready",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

---

## 4. `shardix deploy --target fly`

Generates `fly.toml` for deploying to Fly.io edge microVMs.

```bash
shardix deploy --target fly
```

### Generated `fly.toml`:

```toml
app = "my-shardix-bot"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type = "requests"
    soft_limit = 200
    hard_limit = 250

[[http_service.checks]]
  grace_period = "10s"
  interval = "15s"
  method = "GET"
  timeout = "2s"
  path = "/ready"
```

---

## 5. `shardix deploy --target github`

Scaffolds a complete GitHub Actions workflow at `.github/workflows/deploy.yml` for automated CI/CD:

```bash
shardix deploy --target github
```

### Generated `.github/workflows/deploy.yml`:

```yaml
name: Shardix CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test --if-present

  build-and-deploy:
    name: Build & Push Container
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
```

---

## Production Pre-Deployment Checklist

Before launching your bot in production, ensure you have verified the following items:

- [ ] **Token Security**: `DISCORD_TOKEN` is loaded strictly via environment variables/secrets (never hardcoded in git).
- [ ] **Gateway Intents**: Privileged intents (e.g., `MessageContent`, `GuildMembers`) are enabled in the Discord Developer Portal if required.
- [ ] **Health Probes**: `HealthProvider` is configured on port `8080` with `/ready` and `/live` endpoints.
- [ ] **Graceful Shutdown**: Handled via `app.stop()` in `SIGTERM`/`SIGINT` signals so workers drain properly.
- [ ] **Memory Allocation**: Minimum 256MB–512MB RAM configured per container to prevent OOM kills during heavy interaction spikes.
- [ ] **Redis Connection**: If using distributed queues or event bus, configure persistent connection retries and TLS if required.

---

## Environment Variables Guide

| Variable | Description | Example / Default |
|---|---|---|
| `DISCORD_TOKEN` | Discord Bot Authentication Token | `MTA...` (Required) |
| `DISCORD_CLIENT_ID` | Discord Application ID | `123456789012345678` |
| `NODE_ENV` | Environment identifier | `production` |
| `PORT` | Health and metrics HTTP server port | `8080` |
| `LOG_LEVEL` | Minimum log severity level | `info` (`debug`, `warn`, `error`) |
| `REDIS_URL` | Distributed queue and EventBus connection URL | `redis://default:pass@redis:6379` |
| `S3_BUCKET_NAME` | Storage provider bucket name | `shardix-bot-storage` |
| `AWS_REGION` | Storage AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Storage access key ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Storage secret access key | `wJalr...` |
