# 第一阶段 数据库设计

## 📋 概述

本文档详细定义了 Chat4 多用户系统第一阶段（基础认证与用户管理）所需的数据库表结构。使用 Prisma Schema 进行定义。

### 核心原则
1.  **用户隔离**: 所有与用户相关的数据都必须通过外键 (`user_id`) 与 `users` 表关联，确保数据隔离。
2.  **精简**: 只包含实现第一阶段核心功能所必需的字段。
3.  **可扩展**: 结构设计上为未来可能的功能（如角色、聊天室）预留了关联基础。

---

## 🗄️ Prisma Schema 定义

```prisma
// prisma/schema.prisma (第一阶段核心部分)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // 开发环境，生产环境可配置为 postgresql
  url      = env("DATABASE_URL")
}

// ========================================
// 核心实体: 用户 (Users)
// ========================================
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String?
  password_hash  String?   // 本地认证需要，OAuth用户可能为空
  avatar         String?   // 头像URL
  status         UserStatus @default(PENDING)
  role           UserRole   @default(USER)
  email_verified Boolean   @default(false) // 邮箱验证状态

  // OAuth 关联
  oauth_accounts  OAuthAccount[]

  // 时间戳
  last_login_at  DateTime? @map("last_login_at")
  created_at     DateTime  @default(now()) @map("created_at")
  updated_at     DateTime  @default(now()) @updatedAt @map("updated_at")

  // 索引
  @@index([email])
  @@index([status])
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING  // 主要用于邮箱未验证
  BANNED
}

enum UserRole {
  USER
  ADMIN
  // PREMIUM // 未来扩展预留
}

// ========================================
// OAuth 账户关联
// ========================================
model OAuthAccount {
  id            String   @id @default(cuid())
  user_id       String
  provider      String   // 'google', 'github'
  provider_id   String   // 在提供商处的唯一ID
  access_token  String?
  refresh_token String?
  expires_at    DateTime? @map("expires_at")

  // 关联关系
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // 时间戳
  created_at    DateTime @default(now()) @map("created_at")
  updated_at    DateTime @default(now()) @updatedAt @map("updated_at")

  // 约束
  @@unique([provider, provider_id])
  @@index([user_id, provider])
  @@map("user_oauth_accounts")
}

```

---

## 📊 表结构详解

### 1. `users` 表

| 字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `STRING` (CUID) | `PRIMARY KEY` | 用户的唯一标识符。 |
| `email` | `STRING` | `UNIQUE`, `NOT NULL` | 用户的邮箱地址，用于登录。 |
| `name` | `STRING` | `NULL` | 用户的昵称或显示名称。 |
| `password_hash` | `STRING` | `NULL` | 用户密码的 bcrypt 哈希值。对于通过 OAuth 注册的用户，此字段可能为空。 |
| `avatar` | `STRING` | `NULL` | 用户头像的 URL。 |
| `status` | `ENUM` | `NOT NULL`, `DEFAULT 'PENDING'` | 用户账户状态。 (`ACTIVE`, `INACTIVE`, `PENDING`, `BANNED`) |
| `role` | `ENUM` | `NOT NULL`, `DEFAULT 'USER'` | 用户角色。 (`USER`, `ADMIN`) |
| `email_verified` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | 邮箱是否已验证。 |
| `last_login_at` | `DATETIME` | `NULL` | 用户上次登录的时间。 |
| `created_at` | `DATETIME` | `NOT NULL`, `DEFAULT NOW()` | 用户账户创建时间。 |
| `updated_at` | `DATETIME` | `NOT NULL`, `DEFAULT NOW()`, `ON UPDATE NOW()` | 用户信息最后更新时间。 |

**索引**:
- `idx_users_email` on `email`
- `idx_users_status` on `status`

### 2. `user_oauth_accounts` 表

| 字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `STRING` (CUID) | `PRIMARY KEY` | OAuth 账户关联的唯一标识符。 |
| `user_id` | `STRING` | `NOT NULL` | 关联的 `users` 表的 `id`。 |
| `provider` | `STRING` | `NOT NULL` | OAuth 提供商名称 (e.g., 'google', 'github')。 |
| `provider_id` | `STRING` | `NOT NULL` | 用户在该 OAuth 提供商处的唯一ID。 |
| `access_token` | `STRING` | `NULL` | 用于访问 OAuth 提供商 API 的访问令牌。 |
| `refresh_token` | `STRING` | `NULL` | 用于刷新 `access_token` 的刷新令牌。 |
| `expires_at` | `DATETIME` | `NULL` | `access_token` 的过期时间。 |
| `created_at` | `DATETIME` | `NOT NULL`, `DEFAULT NOW()` | 关联记录创建时间。 |
| `updated_at` | `DATETIME` | `NOT NULL`, `DEFAULT NOW()`, `ON UPDATE NOW()` | 关联信息最后更新时间。 |

**索引/约束**:
- `unique_provider_account` on `provider`, `provider_id` (确保每个提供商的每个账户只能关联一次)
- `idx_user_provider` on `user_id`, `provider` (加速查询用户的所有OAuth账户)
- Foreign Key: `user_id` references `users.id` (ON DELETE CASCADE)

---

## 🔐 JWT Token 结构 (草案)

为了后端实现，这里定义 JWT Payload 的预期结构。

### Access Token Payload
```json
{
  "sub": "user_cuid_123",       // Subject: 用户ID
  "email": "user@example.com",  // 用户邮箱
  "role": "user",               // 用户角色
  "iat": 1698451200,            // Issued At: 签发时间 (Unix timestamp)
  "exp": 1698454800             // Expire At: 过期时间 (Unix timestamp, 例如1小时后)
}
```

### Refresh Token Payload (如果使用 JWT)
```json
{
  "sub": "user_cuid_123",       // Subject: 用户ID
  "type": "refresh",            // Type: 令牌类型
  "iat": 1698451200,            // Issued At: 签发时间
  "exp": 1699056000             // Expire At: 过期时间 (Unix timestamp, 例如7天后)
}
```
*(注：Refresh Token 也可以是随机字符串存储在数据库中，而非 JWT)*