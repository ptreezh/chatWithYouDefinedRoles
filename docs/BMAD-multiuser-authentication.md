# Chat4 多用户认证与并发系统 - BMAD需求规格说明书 (精简版)

## 📋 文档信息
- **项目名称**: Chat4 多用户认证与并发系统
- **版本**: v2.0.1 (精简版)
- **文档类型**: BMAD需求规格说明书
- **创建日期**: 2025-08-20
- **最后更新**: 2025-08-20
- **目标**: 将现有的单用户AI聊天系统升级为支持多用户并发、多种认证方式的AI角色聊天平台 (遵循 KISS/YAGNI/SOLID 原则)

---

## 🎯 项目概述

### 业务目标 (KISS)
- **核心**: 为每个用户提供独立的、可在线访问的AI角色聊天环境。
- **用户增长**: 通过简化注册流程（支持邮箱/密码和主流OAuth）降低门槛。
- **平台扩展**: 建立支持多用户的基础设施，为未来扩展打基础。

### 核心价值主张 (KISS)
**"每个用户都拥有自己的AI角色聊天室"**

---

## 👥 用户角色与场景故事 (YAGNI - 精简)

### 用户角色定义 (KISS)

#### 1. **新用户 (New User)**
- **特征**: 首次访问平台，对AI角色聊天感兴趣
- **需求**: 快速注册，体验基础功能
- **痛点**: 注册流程复杂

#### 2. **个人用户 (Individual User)**
- **特征**: 已注册用户，希望创建和管理自己的AI角色
- **需求**: 私有聊天空间，基本的角色配置
- **痛点**: 无法保存对话历史，角色配置丢失

### 用户场景故事 (KISS - 精简核心)

#### 📖 **故事1: 小明的私有AI聊天室**

**背景**: 小明希望有一个在线的、自己的AI聊天空间。

**用户旅程**:
1. **注册**: 使用邮箱快速注册。
2. **登录**: 使用邮箱/密码或Google登录。
3. **创建**: 创建一个私有的聊天室。
4. **使用**: 在聊天室中与AI角色对话。
5. **安全**: 确保只有自己能访问这个聊天室和其中的角色。

**价值获得**: 
- 拥有了一个在线的、私有的AI聊天环境。
- 可以随时随地访问自己的对话历史。

---

## 🏗️ 系统架构设计 (SOLID/KISS)

### 核心架构原则 (KISS/SOLID)
1.  **用户隔离**: 每个用户的数据（用户信息、聊天室、角色、对话历史）完全隔离。
2.  **简单可扩展**: 架构设计清晰，易于未来添加功能（如角色分享、人格标签等）。
3.  **安全性**: 基础数据安全和认证安全。
4.  **性能**: 支持基础并发访问。

### 系统架构图 (KISS)
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (可选)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                             │
┌───────▼───────┐             ┌──────▼──────┐
│   Next.js     │             │   API GW    │
│   Frontend    │             │  (Express)  │
└───────┬───────┘             └──────┬──────┘
        │                             │
        └─────────────┬───────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Authentication       │
        │        Service            │
        └─────────────┬─────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐        ┌───▼───┐        ┌───▼───┐
│  DB   │        │ Redis │        │  AI   │
│(Prisma)│        │(Cache)│        │Service│
└───────┘        └───────┘        └───────┘
```

---

## 🗄️ 数据库设计 (SOLID/KISS - 最小必要)

### 用户相关表 (KISS)

#### users 表
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  password_hash VARCHAR(255),
  avatar VARCHAR(500),
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user', -- 简化角色
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);
```

#### user_oauth_accounts 表
```sql
CREATE TABLE user_oauth_accounts (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
  provider_id VARCHAR(100) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_account (provider, provider_id),
  INDEX idx_user_provider (user_id, provider)
);
```

### 聊天室与角色相关表 (KISS - 核心隔离)

#### chat_rooms 表
```sql
-- 每个用户默认拥有一个私有聊天室，或可创建多个
CREATE TABLE chat_rooms (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(100) NOT NULL,
  owner_id VARCHAR(50) NOT NULL, -- 关联用户
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id)
);
```

#### characters 表 (角色文件信息与用户关联)
```sql
-- 角色定义与用户关联，实现文件隔离
CREATE TABLE characters (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) NOT NULL, -- 关联用户，实现隔离
  name VARCHAR(100) NOT NULL,
  system_prompt TEXT,
  model_config JSON, -- 存储模型配置
  file_path VARCHAR(500), -- 角色文件在服务器上的路径 (用户隔离的路径)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
```

#### messages 表
```sql
CREATE TABLE messages (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  content TEXT NOT NULL,
  sender_type ENUM('user', 'character', 'system') NOT NULL,
  sender_id VARCHAR(50), -- 用户ID 或 角色ID
  chat_room_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  INDEX idx_chat_room (chat_room_id),
  INDEX idx_created_at (created_at)
);
```

---

## 🔐 认证系统设计 (KISS/YAGNI)

### 支持的认证方式 (KISS - 核心)

#### 1. **本地认证 (KISS)**
- 邮箱 + 密码
- 密码强度验证（基础）
- 邮箱验证机制（基础）

#### 2. **OAuth认证 (KISS - 主流)**
- Google OAuth 2.0
- GitHub OAuth 2.0
- （可选）微信扫码登录

### JWT Token设计 (KISS)
```typescript
interface JWTPayload {
  sub: string;           // 用户ID
  email: string;         // 用户邮箱
  iat: number;           // 签发时间
  exp: number;           // 过期时间
  type: 'access' | 'refresh'; // Token类型
}
```

---

## 🛡️ 安全设计 (KISS)

### 数据安全 (KISS)
- **密码加密**: bcrypt + salt
- **HTTPS强制**: 全站HTTPS
- **CORS配置**: 基础跨域控制

### 访问控制 (KISS)
- **JWT认证**: 无状态认证
- **数据隔离**: 用户只能访问自己的数据（用户、聊天室、角色、消息）。

---

## 📱 API设计 (SOLID/KISS - 核心)

### 认证相关API (KISS)
```
POST /api/auth/register           # 用户注册
POST /api/auth/login              # 用户登录
POST /api/auth/logout             # 用户登出
POST /api/auth/refresh            # 刷新Token
GET  /api/auth/verify-email       # 验证邮箱 (基础)
GET  /api/auth/me                 # 获取当前用户信息
```

### OAuth相关API (KISS)
```
GET  /api/oauth/:provider         # 重定向到OAuth提供商
GET  /api/oauth/:provider/callback # OAuth回调
```

### 用户管理API (KISS)
```
GET    /api/users/me              # 获取当前用户信息
PUT    /api/users/me              # 更新用户信息 (基础字段)
DELETE /api/users/me              # 删除用户账户
```

### 聊天室管理API (KISS - 核心)
```
GET    /api/chat-rooms            # 获取当前用户的所有聊天室
POST   /api/chat-rooms            # 创建聊天室
GET    /api/chat-rooms/:id         # 获取聊天室详情
DELETE /api/chat-rooms/:id         # 删除聊天室 (软删除)
```

### 角色管理API (KISS - 核心隔离)
```
GET    /api/characters            # 获取当前用户的所有角色
POST   /api/characters            # 创建/上传角色 (关联到用户)
GET    /api/characters/:id         # 获取角色详情
PUT    /api/characters/:id         # 更新角色 (基础信息)
DELETE /api/characters/:id         # 删除角色 (软删除/物理删除文件)
```

### 消息API (KISS)
```
GET    /api/chat-rooms/:id/messages # 获取聊天室消息历史
POST   /api/chat-rooms/:id/messages # 发送消息
```

---

## 🎨 前端界面设计 (KISS)

### 用户认证界面 (KISS)
- **登录/注册页面**: 简洁，支持邮箱密码和OAuth按钮。
- **个人资料页**: 基础信息编辑（昵称、头像）。

### 聊天室管理界面 (KISS)
- **聊天室列表**: 当前用户的所有聊天室。
- **创建聊天室**: 简单表单。

### 聊天界面 (KISS)
- **消息列表**: 显示消息。
- **输入区域**: 发送消息。
- **角色选择**: 从当前聊天室关联的角色中选择。

---

## 🚀 实施计划 (KISS/YAGNI - 分阶段核心)

### 第一阶段：基础认证与用户管理（1-2周）
- [ ] 数据库核心表设计和迁移 (users, user_oauth_accounts)
- [ ] 用户注册、登录、登出API (邮箱/密码, JWT)
- [ ] 基础OAuth集成 (Google)
- [ ] 基础前端登录/注册界面
- [ ] 用户个人资料页面（基础信息）

### 第二阶段：核心聊天室与角色系统（2-3周）
- [ ] 聊天室管理API (创建、列表、删除)
- [ ] 角色管理API (创建/上传、列表、更新、删除) - 实现文件隔离
- [ ] 消息存储与查询API
- [ ] 聊天室和角色管理前端界面
- [ ] 基础聊天界面
- [ ] 单元测试和集成测试

### 第三阶段：优化与上线（1周）
- [ ] 性能优化
- [ ] 安全加固
- [ ] 文档完善
- [ ] 部署上线

*注：复杂的用户画像、人格标签、高级推荐、企业功能等均移至未来版本规划。*

---

## 🧪 测试策略 (KISS)

### 单元测试 (KISS)
- 核心业务逻辑（认证、用户、聊天室、角色服务）
- 数据模型方法

### 集成测试 (KISS)
- 用户注册到登录流程
- OAuth认证流程
- 聊天室和角色的基本CRUD操作
- 消息发送和获取

### E2E测试 (KISS)
- 完整用户注册/登录流程
- 创建聊天室、添加角色、发送消息的完整流程

---

## 📊 监控和维护 (KISS)

### 基础监控
- API响应时间
- 错误率
- 系统资源使用

### 基础日志
- 应用日志
- 安全日志（登录尝试等）

---

## 🔮 未来扩展规划 (YAGNI - 明确推迟)

### 中短期扩展（V2+）
- [ ] **角色分享机制**: 基于角色ID的分享链接，接收方可复制到自己的空间。
- [ ] **基础用户偏好设置**: 简单的界面主题、通知开关等。
- [ ] **GitHub OAuth集成** (如未在V1完成)

### 长期扩展（V3+）
- [ ] **用户人格标签系统**: 独立模块，用于分析和存储用户人格特征。
- [ ] **基于人格的沟通方式推荐**: 利用人格标签，为用户和AI角色匹配最佳交互策略。
- [ ] **高级角色市场**: 用户可上传、评价、下载他人分享的角色。
- [ ] **多用户聊天室**: 在确保安全和隔离的前提下，支持用户邀请他人加入特定聊天室。

---

## 📝 附录

### 技术栈选择 (KISS)
- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **认证**: NextAuth.js + JWT
- **实时通信**: Socket.IO (可选，用于未来实时功能)

### 开发规范 (SOLID/KISS)
- **代码风格**: ESLint + Prettier
- **Git流程**: Git Flow
- **代码审查**: Pull Request
- **CI/CD**: GitHub Actions

---

**文档结束**

本精简版需求规格说明书遵循KISS、YAGNI和SOLID原则，聚焦于将Chat4升级为一个基础但稳固的多用户AI角色聊天平台，将复杂功能推迟到未来版本。