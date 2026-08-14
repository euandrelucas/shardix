---
title: Ferramentas de Deploy & Gerador CLI
description: Gerador automatizado de arquivos de deploy para bots Shardix Discord com suporte a Docker, Kubernetes, Railway, Fly.io e workflows CI/CD do GitHub Actions.
---

# 🚀 Ferramentas de Deploy & Gerador CLI

A Shardix CLI (`@shardix/cli`) inclui geradores automatizados de infraestrutura (`shardix deploy`) que produzem configurações otimizadas e prontas para produção para containers e nuvens modernas sem qualquer vendor lock-in.

---

## Visão Geral: O que as ferramentas de deploy geram

O comando `shardix deploy` analisa a estrutura do seu projeto (se utiliza Gateway ou interações HTTP, Redis, storage S3, workers de cluster ou health checks) e gera todos os arquivos de infraestrutura necessários:

- 🐳 **Docker**: Containers Alpine leves em múltiplos estágios (multi-stage) com cache de camadas e usuário sem privilégios root
- ☸️ **Kubernetes**: Manifestos de Deployments, Services, ConfigMaps, Secrets e probes automáticos de liveness/readiness
- 🚂 **Railway**: Configuração nativa via Nixpacks, modelos de variáveis de ambiente e health checks integrados
- 🎈 **Fly.io**: Arquivo `fly.toml` pronto para microVMs edge com volumes persistentes
- 🐙 **GitHub Actions**: Pipeline completo de CI/CD executando testes, build da imagem Docker e publicação automatizada

```bash
# Assistente interativo de deploy
shardix deploy

# Geração direta por plataforma alvo
shardix deploy --target <docker|k8s|railway|fly|github>
```

---

## 1. `shardix deploy --target docker`

Gera um `Dockerfile` multi-stage otimizado e `.dockerignore`.

```bash
shardix deploy --target docker
```

### `Dockerfile` Gerado:

```dockerfile
# -------------------------------------------------------------------
# Estágio 1: Build & Dependências
# -------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

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
# Estágio 2: Execução em Produção
# -------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Segurança: Executar com usuário sem privilégios de root
USER node

COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 8080

# Health check integrado
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ready || exit 1

CMD ["node", "dist/index.js"]
```

---

## 2. `shardix deploy --target k8s`

Gera manifestos de deployment e service do Kubernetes em `k8s/deployment.yaml`.

```bash
shardix deploy --target k8s
```

### Manifesto `k8s/deployment.yaml`:

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
          image: ghcr.io/sua-org/shardix-bot:latest
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

Gera o arquivo `railway.json` e configura as opções de compilação da Railway.

```bash
shardix deploy --target railway
```

### Passo a Passo para Deploy na Railway:

1. **Instale a CLI da Railway** (ou conecte seu repositório via GitHub):
   ```bash
   npm i -g @railway/cli
   railway login
   ```
2. **Inicialize o Projeto**:
   ```bash
   railway init
   ```
3. **Provisione Redis (Opcional)**:
   ```bash
   railway add -d redis
   ```
4. **Configure as Variáveis de Ambiente**:
   ```bash
   railway variables set DISCORD_TOKEN="seu-token-do-bot"
   ```
5. **Realize o Deploy**:
   ```bash
   railway up
   ```

### `railway.json` Gerado:

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

Gera `fly.toml` para executar seu bot em microVMs distribuídas da Fly.io.

```bash
shardix deploy --target fly
```

### `fly.toml` Gerado:

```toml
app = "meu-bot-shardix"
primary_region = "gru"

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

Cria um workflow completo de automação em `.github/workflows/deploy.yml`:

```bash
shardix deploy --target github
```

### `.github/workflows/deploy.yml` Gerado:

```yaml
name: Pipeline CI/CD Shardix

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint & Testes
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
    name: Build e Push do Container
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Autenticar no GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push da Imagem Docker
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
```

---

## Checklist Pré-Deploy em Produção

Antes de disponibilizar seu bot para usuários finais, valide estes pontos:

- [ ] **Segurança de Tokens**: O `DISCORD_TOKEN` deve vir estritamente de variáveis de ambiente/secrets (nunca salvo no Git).
- [ ] **Intents do Gateway**: Certifique-se de habilitar as intents privilegiadas necessárias no Discord Developer Portal.
- [ ] **Probes de Saúde**: O `HealthProvider` está habilitado na porta `8080` com rotas `/ready` e `/live`.
- [ ] **Encerramento Gracioso**: Manipuladores de `SIGTERM` e `SIGINT` chamam `app.stop()` para drenar workers sem interromper tarefas.
- [ ] **Alocação de Memória**: Configure no mínimo 256MB–512MB de RAM por container para suportar picos de tráfego.
- [ ] **Conexão Redis**: Ao usar filas distribuídas ou Event Bus, habilite retentativas de conexão e TLS quando aplicável.

---

## Guia de Variáveis de Ambiente

| Variável | Descrição | Exemplo / Padrão |
|---|---|---|
| `DISCORD_TOKEN` | Token de autenticação do bot no Discord | `MTA...` (Obrigatório) |
| `DISCORD_CLIENT_ID` | Application ID do bot | `123456789012345678` |
| `NODE_ENV` | Identificador de ambiente | `production` |
| `PORT` | Porta do servidor HTTP de health e métricas | `8080` |
| `LOG_LEVEL` | Nível mínimo de severidade dos logs | `info` (`debug`, `warn`, `error`) |
| `REDIS_URL` | URL de conexão Redis para filas e EventBus | `redis://default:senha@redis:6379` |
| `S3_BUCKET_NAME` | Nome do bucket de armazenamento | `meu-bucket-shardix` |
| `AWS_REGION` | Região da AWS do bucket S3 | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Chave de acesso AWS | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Segredo da chave de acesso AWS | `wJalr...` |
