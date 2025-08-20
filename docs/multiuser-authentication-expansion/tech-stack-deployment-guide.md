# 技术栈与部署指南 (精简版)

## 📋 文档信息
- **项目**: Chat4 多用户认证与并发系统 (精简版)
- **版本**: v2.0.1
- **创建日期**: 2025-08-20
- **目标**: 详细说明精简后的技术栈选择和基础部署方案

---

## 🏗️ 技术栈选择 (KISS)

### 前端技术栈 (KISS)
```json
{
  "framework": "Next.js 15",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "ui-components": "shadcn/ui (按需引入)",
  "state-management": "React Context API / Zustand (简单状态)",
  "forms": "React Hook Form",
  "data-fetching": "SWR (或 TanStack Query 简化版)",
  "real-time": "Socket.IO Client (可选，用于未来实时功能)"
}
```

### 后端技术栈 (KISS)
```json
{
  "runtime": "Node.js 20",
  "framework": "Next.js API Routes",
  "database": "SQLite (开发) / PostgreSQL (生产)",
  "orm": "Prisma 5",
  "cache": "Redis (可选，用于会话或缓存)",
  "authentication": "NextAuth.js 5 (支持 Credentials & OAuth)",
  "real-time": "Socket.IO (可选)",
  "file-storage": "本地文件系统 (用户隔离目录) / AWS S3 (生产可选)"
}
```

### 开发工具 (KISS)
```json
{
  "package-manager": "npm 或 pnpm",
  "testing": "Jest (单元/集成) + Playwright (E2E)",
  "linting": "ESLint + Prettier",
  "type-checking": "TypeScript",
  "build-tools": "Next.js 自带编译器",
  "containerization": "Docker (可选，用于生产部署)",
  "ci-cd": "GitHub Actions",
  "monitoring": "基础日志 (Winston) + (可选) Sentry"
}
```

---

## 🗄️ 基础设施设计 (KISS)

### 简化系统架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (可选)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                             │
┌───────▼───────┐             ┌──────▼──────┐
│   Next.js     │             │   API GW    │
│   Frontend    │             │  (Next.js)  │
└───────┬───────┘             └──────┬──────┘
        │                             │
        └─────────────┬───────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Authentication       │
        │        Service            │
        │     (NextAuth.js)         │
        └─────────────┬─────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐        ┌───▼───┐        ┌───▼───┐
│  DB   │        │ Cache │        │  AI   │
│(SQLite/PG)│    │(Redis)│        │(Ollama)│
└───────┘        └───────┘        └───────┘
```

### 数据库架构 (KISS - 核心表)
```sql
-- 主数据库配置 (根据环境选择SQLite或PostgreSQL)
-- 核心表已在BMAD文档中定义:
-- users, user_oauth_accounts, chat_rooms, characters, messages
-- 索引优化: 为常用查询字段 (如 user_id, email, chat_room_id) 创建索引
```

### 缓存策略 (可选)
```typescript
// Redis配置 (如果使用)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // 简单的缓存策略用于会话或热点数据
  sessionCache: { ttl: 3600 }, // 1小时
};
```

---

## 🚀 基础部署方案 (KISS)

### 本地开发 (KISS)
```bash
# 1. 克隆项目
git clone <your-chat4-repo-url>
cd chat4

# 2. 安装依赖
npm install

# 3. 配置环境变量 (复制 .env.example 为 .env.local 并填写)
cp .env.example .env.local
# 编辑 .env.local 设置 DATABASE_URL, NEXTAUTH_SECRET 等

# 4. 数据库迁移 (Prisma)
npx prisma migrate dev --name init

# 5. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### Docker容器化 (可选，生产推荐)
```dockerfile
# Dockerfile (KISS)
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma Client Generation (如果需要)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml (基础版)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/chat4
    depends_on:
      - db
    volumes:
      - ./user_data:/app/user_data # 挂载用户数据目录

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=chat4
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 直接部署到服务器 (KISS)
```bash
# 1. 在服务器上安装 Node.js 20 和 PostgreSQL

# 2. 克隆代码
git clone <your-chat4-repo-url>
cd chat4

# 3. 安装依赖
npm ci --production # 仅安装生产依赖

# 4. 构建应用
npm run build

# 5. 设置环境变量 (例如使用 systemd 的 EnvironmentFile)
# 创建 /etc/chat4/.env 并配置

# 6. 数据库迁移 (首次部署)
DATABASE_URL=... npx prisma migrate deploy

# 7. 启动应用 (可以使用 PM2 或 systemd 管理进程)
# 使用 PM2 示例:
# npm install -g pm2
# pm2 start npm --name "chat4" -- start
```

### Nginx 配置 (生产环境推荐)
```nginx
# nginx.conf (基础HTTPS反向代理)
events {
    worker_connections 1024;
}

http {
    upstream chat4_app {
        server localhost:3000;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /path/to/your/cert.pem;
        ssl_certificate_key /path/to/your/key.pem;

        # 基础安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://chat4_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

## 🌐 云部署方案 (可选)

### 基础环境变量配置 (KISS)
```bash
# .env.production (或通过云平台的Secrets管理)
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-change-this

# 数据库 (根据选择)
DATABASE_URL=postgresql://user:password@your-db-host:5432/chat4

# OAuth (根据需要配置)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 文件存储 (如果使用S3)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# S3_BUCKET_NAME=...
```

---

## 🔧 基础监控与日志 (KISS)

### 应用监控 (基础)
```typescript
// 基础监控配置
const monitoringConfig = {
  // 性能监控 (基础指标)
  performance: {
    responseTime: {
      warning: 500, // 500ms
      critical: 1000 // 1s
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.1 // 10%
    }
  }
};
```

### 日志配置 (KISS)
```typescript
// 基础日志配置 (Winston)
const loggingConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
};
```

---

## 🔄 CI/CD流程 (KISS)

### GitHub Actions基础配置
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run migrations
        run: npx prisma migrate dev --name ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres

  # build-and-deploy job 可以根据具体部署目标 (VPS, Docker, Serverless) 来配置
```

---

## 📈 基础性能优化 (KISS)

### 数据库优化 (KISS)
```sql
-- 基础索引优化
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_chat_rooms_owner_id ON chat_rooms(owner_id);
CREATE INDEX CONCURRENTLY idx_characters_user_id ON characters(user_id);
CREATE INDEX CONCURRENTLY idx_messages_chat_room_id_created_at ON messages(chat_room_id, created_at);
```

### 前端优化 (Next.js 内置)
-   **代码分割**: Next.js App Router 自动进行代码分割。
-   **图片优化**: 使用 Next.js 的 `<Image>` 组件。
-   **静态资源**: 利用 `public` 目录和 CDN。

---

## 🛡️ 基础安全配置 (KISS)

### 网络安全 (基础)
- **HTTPS**: 强制使用HTTPS (通过Nginx或云服务商)。
- **CORS**: 在Next.js中配置合理的CORS策略。
- **防火墙**: 在服务器或云服务商处配置安全组，只开放必要端口 (如 22, 80, 443)。

### 应用安全 (基础)
```typescript
// 基础安全中间件配置
const securityConfig = {
  // CORS配置
  cors: {
    origin: process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  
  // 内容安全策略 (基础)
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind需要
        scriptSrc: ["'self'"], // Next.js CSP需要配置，此处简化
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:"], // WebSocket
      }
    }
  }
};
```

---

**文档结束**

本文档为Chat4项目提供了精简且实用的技术实现和基础部署方案，遵循KISS原则，确保项目能够快速启动和稳定运行。