# Chat4 项目概述

## 项目简介

Chat4 是一个现代化的开源AI聊天应用，支持多个AI提供商，包括Ollama本地LLM集成。它专注于隐私优先设计，允许用户在本地运行AI模型并控制自己的数据。

## 核心特性

- **隐私优先设计**：支持本地LLM运行，数据存储在用户本地。
- **多AI提供商支持**：支持Ollama、OpenAI、Claude等。
- **高级角色管理**：可创建和管理多个AI角色，持久化对话历史。
- **企业级测试**：包含单元测试、集成测试和端到端测试。
- **现代化架构**：使用Next.js 15、TypeScript、Prisma ORM等技术栈。

## 技术栈

### 前端
- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.IO (客户端)

### 后端
- Next.js API Routes
- TypeScript
- Prisma ORM
- SQLite (开发环境)
- Socket.IO (服务端)

### AI 集成
- Ollama (本地LLM)
- OpenAI API
- Anthropic API

## 项目结构
```
F:\Chat4
├── .next/                 # Next.js 构建输出目录
├── prisma/                # Prisma 数据库定义和迁移
├── public/                # 静态资源
├── src/                   # 源代码
│   ├── app/               # Next.js App Router 页面
│   ├── components/        # React 组件
│   ├── lib/               # 核心库 (数据库、Socket.IO等)
│   └── ...
├── tests/                 # 测试文件
├── package.json           # 项目依赖和脚本
├── server.ts              # 自定义Node.js服务器入口 (集成Socket.IO)
├── tsconfig.json          # TypeScript 配置
└── ...
```

## 构建和运行

### 系统要求
- Node.js 18.0 或更高版本
- npm 最新版本
- Git

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
# 启动开发服务器 (使用 tsx 运行 server.ts)
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm run start
```

## 测试

项目包含多种测试类型：

- **单元测试**: `npm run test:unit`
- **集成测试**: `npm run test:integration`
- **端到端测试**: `npm run test:e2e`
- **性能测试**: `npm run test:performance`
- **所有测试**: `npm run test:all`

代码质量检查：
- **Lint**: `npm run lint`
- **类型检查**: `npm run type-check`

## 开发约定

- 使用TypeScript进行类型安全开发。
- 使用Jest进行测试。
- 使用Prisma ORM进行数据库操作。
- 使用Socket.IO实现实时通信。
- 遵循Next.js最佳实践。

## 入口文件

- **Web应用**: `src/app/` 目录下的Next.js页面。
- **自定义服务器**: `server.ts` 文件，负责启动Next.js应用并集成Socket.IO。
- **数据库**: `src/lib/db.ts` 使用Prisma Client。
- **实时通信**: `src/lib/socket.ts` 配置Socket.IO服务端逻辑。