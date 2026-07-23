# Deploy em Produção

Implantação de aplicações Shardix em ambientes de produção usando Docker, Kubernetes, PM2 ou plataformas serverless.

---

## 🐳 Implantação com Docker

Crie um `Dockerfile` para o seu bot Shardix:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000 3005
CMD ["node", "dist/main.js"]
```

---

## ☸️ Manifesto Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shardix-bot
  labels:
    app: shardix-bot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shardix-bot
  template:
    metadata:
      labels:
        app: shardix-bot
    spec:
      containers:
        - name: shardix-bot
          image: seu-registry/shardix-bot:latest
          env:
            - name: DISCORD_TOKEN
              valueFrom:
                secretKeyRef:
                  name: bot-secrets
                  key: DISCORD_TOKEN
          ports:
            - containerPort: 3005
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3005
            initialDelaySeconds: 10
            periodSeconds: 5
```
