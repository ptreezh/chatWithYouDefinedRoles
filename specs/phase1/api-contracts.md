# 第一阶段 API 契约

## 📋 概述

本文档定义了 Chat4 多用户系统第一阶段（基础认证与用户管理）所需的核心 API 接口契约。所有接口均遵循 RESTful 设计原则。

### 认证方式
- **无认证**: `POST /api/auth/register`, `POST /api/auth/login` - 注册和登录接口无需前置认证。
- **JWT Bearer Token**: 除上述接口外，所有其他接口均需在 HTTP Header 中提供有效的 JWT Token。
  - `Authorization: Bearer <your-jwt-token>`

### 响应格式
所有响应均使用 JSON 格式。
```json
// 成功响应通用结构
{
  "success": true,
  "data": {}, // 具体数据
  "message": "Success message (optional)"
}

// 错误响应通用结构
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## 🚪 认证相关

### 1. 用户注册
**URL**: `POST /api/auth/register`
**描述**: 使用邮箱和密码创建新用户账户。

**请求体 (Request Body)**:
```json
{
  "email": "user@example.com",
  "password": "strongpassword123",
  "name": "User Name" // 可选
}
```

**成功响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_cuid_123",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": null,
      "status": "pending", // 邮箱待验证
      "role": "user",
      "createdAt": "2023-10-27T10:00:00Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
    }
  },
  "message": "User registered successfully. Please check your email to verify your account."
}
```

**错误响应**:
- `400 Bad Request`: 请求体格式错误或缺少必填字段。
  ```json
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid email format." } }
  ```
- `409 Conflict`: 邮箱地址已被注册。
  ```json
  { "success": false, "error": { "code": "EMAIL_EXISTS", "message": "Email address is already in use." } }
  ```

---

### 2. 用户登录
**URL**: `POST /api/auth/login`
**描述**: 使用邮箱和密码进行用户身份验证。

**请求体 (Request Body)**:
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_cuid_123",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": null,
      "status": "active", // 或 "pending"
      "role": "user",
      "lastLoginAt": "2023-10-27T10:05:00Z",
      "createdAt": "2023-10-27T10:00:00Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
    }
  },
  "message": "Login successful."
}
```

**错误响应**:
- `400 Bad Request`: 请求体格式错误或缺少必填字段。
- `401 Unauthorized`: 邮箱或密码错误。
  ```json
  { "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password." } }
  ```
- `403 Forbidden`: 账户未激活（邮箱未验证）。
  ```json
  { "success": false, "error": { "code": "ACCOUNT_INACTIVE", "message": "Please verify your email address to activate your account." } }
  ```

---

### 3. 用户登出
**URL**: `POST /api/auth/logout`
**描述**: 使当前用户的 JWT Token 失效（可选实现，取决于服务端是否维护 Token 黑名单）。

**请求体 (Request Body)**: None

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "message": "You have been logged out."
}
```

**错误响应**:
- `401 Unauthorized`: Token 无效或已过期。

---

### 4. 刷新访问令牌
**URL**: `POST /api/auth/refresh`
**描述**: 使用有效的 Refresh Token 获取新的 Access Token。

**请求体 (Request Body)**:
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "new_access_token_here...",
      "refreshToken": "new_refresh_token_here..." // 可选，是否每次都更新 refreshToken
    }
  },
  "message": "Token refreshed successfully."
}
```

**错误响应**:
- `400 Bad Request`: 缺少 Refresh Token。
- `401 Unauthorized`: Refresh Token 无效或已过期。

---

### 5. 获取当前用户信息
**URL**: `GET /api/auth/me`
**描述**: 获取当前已认证用户的信息。

**请求体 (Request Body)**: None

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_cuid_123",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": null,
      "status": "active",
      "role": "user",
      "lastLoginAt": "2023-10-27T10:05:00Z",
      "createdAt": "2023-10-27T10:00:00Z"
    }
  }
}
```

**错误响应**:
- `401 Unauthorized`: Token 无效或已过期。

---

## 🔗 OAuth 相关

### 6. 重定向到 OAuth 提供商
**URL**: `GET /api/oauth/:provider`
**描述**: 将用户重定向到指定的 OAuth 提供商（如 google, github）进行授权。

**路径参数 (Path Parameters)**:
- `provider`: OAuth 提供商名称 (e.g., `google`, `github`).

**查询参数 (Query Parameters)**: None

**响应**: HTTP 302 重定向到 OAuth 提供商的授权页面。

---

### 7. OAuth 回调处理
**URL**: `GET /api/oauth/:provider/callback`
**描述**: 接收 OAuth 提供商的回调，完成用户认证或账户关联。

**路径参数 (Path Parameters)**:
- `provider`: OAuth 提供商名称 (e.g., `google`, `github`).

**查询参数 (Query Parameters)** (由 OAuth 提供商提供):
- `code`: 授权码。
- `state`: 用于防止 CSRF 攻击的状态参数。

**成功响应 (200 OK 或 302 Redirect)**:
- 如果是新用户注册并成功：返回或重定向到应用主页，并携带 JWT Token。
- 如果是老用户登录并成功：返回或重定向到应用主页，并携带 JWT Token。
- 如果是已登录用户关联新 OAuth 账户：返回或重定向到账户设置页面，提示关联成功。

**错误响应**:
- `400 Bad Request`: 回调参数错误。
- `401 Unauthorized`: OAuth 授权失败。
- `503 Service Unavailable`: 与 OAuth 提供商通信失败。

---

## 👤 用户管理相关

### 8. 更新当前用户信息
**URL**: `PUT /api/users/me`
**描述**: 更新当前已认证用户的基本信息（如昵称）。

**请求体 (Request Body)**:
```json
{
  "name": "New User Name" // 可选，要更新的字段
  // 可以添加其他允许用户更新的字段，如 avatar (URL)
}
```

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_cuid_123",
      "email": "user@example.com",
      "name": "New User Name",
      "avatar": null,
      "status": "active",
      "role": "user",
      "lastLoginAt": "2023-10-27T10:05:00Z",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T11:00:00Z"
    }
  },
  "message": "User profile updated successfully."
}
```

**错误响应**:
- `400 Bad Request`: 请求体格式错误或包含不允许更新的字段。
- `401 Unauthorized`: Token 无效或已过期。

---

### 9. 删除当前用户账户
**URL**: `DELETE /api/users/me`
**描述**: 删除当前已认证用户的账户。这是一个危险操作，通常需要二次确认。

**请求体 (Request Body)**: None (或可以要求提供密码进行二次验证)

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "message": "Your account has been deleted."
}
```

**错误响应**:
- `401 Unauthorized`: Token 无效或已过期。
- `403 Forbidden`: (如果需要密码验证但未提供或错误)