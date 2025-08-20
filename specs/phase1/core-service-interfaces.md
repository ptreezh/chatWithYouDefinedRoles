# 第一阶段 核心服务接口定义

## 📋 概述

本文档定义了 Chat4 多用户系统第一阶段（基础认证与用户管理）核心业务逻辑的服务接口。这些接口是应用领域层的核心，旨在隔离业务逻辑与具体的基础设施实现（如数据库、外部API）。

### 设计原则
1.  **SOLID - 接口隔离原则 (ISP)**: 定义细粒度的接口，避免“胖接口”。
2.  **SOLID - 依赖倒置原则 (DIP)**: 服务实现依赖于这些抽象接口，而不是具体的实现类。
3.  **关注点分离**: 每个服务只负责一个明确的业务领域。
4.  **可测试性**: 接口设计便于进行 Mock 和单元测试。

---

## 🔐 认证服务 (AuthService)

处理用户注册、登录、登出、Token 刷新等核心认证流程。

```typescript
// src_new/modules/auth/application/interfaces/auth.service.interface.ts

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthServiceInterface {
  /**
   * 用户注册
   * @param data - 注册数据
   * @returns Promise<AuthTokens> - 成功则返回访问和刷新令牌
   * @throws {EmailExistsError} - 邮箱已被注册
   * @throws {ValidationError} - 输入数据验证失败
   */
  register(data: RegisterData): Promise<AuthTokens>;

  /**
   * 用户登录
   * @param data - 登录数据
   * @returns Promise<AuthTokens> - 成功则返回访问和刷新令牌
   * @throws {InvalidCredentialsError} - 邮箱或密码错误
   * @throws {AccountInactiveError} - 账户未激活
   * @throws {ValidationError} - 输入数据验证失败
   */
  login(data: LoginData): Promise<AuthTokens>;

  /**
   * 用户登出 (可选实现)
   * @param userId - 用户ID
   * @param refreshToken - 刷新令牌 (用于加入黑名单)
   */
  logout(userId: string, refreshToken: string): Promise<void>;

  /**
   * 刷新访问令牌
   * @param refreshToken - 有效的刷新令牌
   * @returns Promise<AuthTokens> - 新的访问和刷新令牌
   * @throws {InvalidTokenError} - 令牌无效或已过期
   */
  refreshAccessToken(refreshToken: string): Promise<AuthTokens>;

  /**
   * 验证 JWT 访问令牌 (供API守卫/中间件使用)
   * @param token - JWT 访问令牌
   * @returns Promise<{ userId: string, email: string, role: string }> - 解码后的用户信息
   * @throws {InvalidTokenError} - 令牌无效或已过期
   */
  validateAccessToken(token: string): Promise<{ userId: string; email: string; role: string }>;
}

// 自定义错误类型 (位于 src_new/shared/kernel/errors.ts 或类似位置)
export class EmailExistsError extends Error { constructor(message: string = "Email address is already in use.") { super(message); } }
export class InvalidCredentialsError extends Error { constructor(message: string = "Invalid email or password.") { super(message); } }
export class AccountInactiveError extends Error { constructor(message: string = "Please verify your email address to activate your account.") { super(message); } }
export class InvalidTokenError extends Error { constructor(message: string = "Invalid or expired token.") { super(message); } }
export class ValidationError extends Error { constructor(message: string) { super(message); } }
```

---

## 👤 用户服务 (UserService)

处理用户信息的查询、更新和删除等操作。

```typescript
// src_new/modules/user/application/interfaces/user.service.interface.ts

// 注意：User 类型定义通常在领域层 models 中 (src_new/modules/user/domain/models/user.ts)
// 这里为了简洁，假设 User 类型已定义
import { User } from '../../domain/models/user';

export interface UpdateUserData {
  name?: string;
  // avatar?: string; // 可以后期添加
}

export interface UserServiceInterface {
  /**
   * 根据用户ID获取用户信息
   * @param userId - 用户ID
   * @returns Promise<User | null> - 找到则返回用户对象，否则返回null
   */
  getUserById(userId: string): Promise<User | null>;

  /**
   * 根据邮箱获取用户信息
   * @param email - 用户邮箱
   * @returns Promise<User | null> - 找到则返回用户对象，否则返回null
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * 更新用户信息
   * @param userId - 用户ID
   * @param data - 要更新的数据
   * @returns Promise<User> - 更新后的用户对象
   * @throws {UserNotFoundError} - 用户未找到
   * @throws {ValidationError} - 输入数据验证失败
   */
  updateUser(userId: string, data: UpdateUserData): Promise<User>;

  /**
   * 删除用户账户
   * @param userId - 用户ID
   * @returns Promise<void>
   * @throws {UserNotFoundError} - 用户未找到
   */
  deleteUser(userId: string): Promise<void>;
}

// 自定义错误类型
export class UserNotFoundError extends Error { constructor(message: string = "User not found.") { super(message); } }
```

---

## 🗃️ 用户仓储 (UserRepository)

定义了与 `users` 表交互的抽象方法。这是领域层与数据持久化层之间的接口。

```typescript
// src_new/modules/user/domain/interfaces/user.repository.interface.ts

import { User } from '../models/user';

export interface CreateUserData {
  email: string;
  password_hash?: string; // 本地认证需要
  name?: string;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BANNED';
  role?: 'USER' | 'ADMIN';
  email_verified?: boolean;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BANNED';
  updated_at?: Date; // 通常由仓储自动设置
}

export interface UserRepositoryInterface {
  /**
   * 创建新用户
   * @param data - 用户数据
   * @returns Promise<User> - 创建的用户对象
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * 根据ID查找用户
   * @param id - 用户ID
   * @returns Promise<User | null>
   */
  findById(id: string): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   * @param email - 用户邮箱
   * @returns Promise<User | null>
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param data - 要更新的数据
   * @returns Promise<User> - 更新后的用户对象
   * @throws {UserNotFoundError} - 如果用户不存在
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * 删除用户
   * @param id - 用户ID
   * @returns Promise<void>
   * @throws {UserNotFoundError} - 如果用户不存在
   */
  delete(id: string): Promise<void>;
}

// 仓储的错误通常由实现层抛出，如 Prisma 的 RecordNotFound
```

---

## 🔗 OAuth 账户服务 (OAuthAccountService) (可选，但推荐)

处理 OAuth 账户的关联、查询和解除关联。

```typescript
// src_new/modules/auth/application/interfaces/oauth-account.service.interface.ts

import { OAuthAccount } from '../../domain/models/oauth-account'; // 假设已定义

export interface LinkOAuthAccountData {
  userId: string;
  provider: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface OAuthAccountServiceInterface {
  /**
   * 关联 OAuth 账户到本地用户
   * @param data - OAuth 账户数据
   * @returns Promise<OAuthAccount> - 创建的关联记录
   * @throws {AccountAlreadyLinkedError} - 该提供商账户已被其他用户关联
   */
  linkAccount(data: LinkOAuthAccountData): Promise<OAuthAccount>;

  /**
   * 根据提供商和提供商ID查找OAuth账户
   * @param provider - OAuth 提供商
   * @param providerId - 在提供商处的唯一ID
   * @returns Promise<OAuthAccount | null>
   */
  findByProviderAndId(provider: string, providerId: string): Promise<OAuthAccount | null>;

  /**
   * 查找用户关联的所有OAuth账户
   * @param userId - 用户ID
   * @returns Promise<OAuthAccount[]>
   */
  findAccountsByUserId(userId: string): Promise<OAuthAccount[]>;

  /**
   * 解除 OAuth 账户关联
   * @param userId - 用户ID
   * @param provider - OAuth 提供商
   * @returns Promise<void>
   * @throws {AccountNotLinkedError} - 该用户未关联此提供商的账户
   */
  unlinkAccount(userId: string, provider: string): Promise<void>;
}

// 自定义错误类型
export class AccountAlreadyLinkedError extends Error { constructor(message: string = "This OAuth account is already linked to another user.") { super(message); } }
export class AccountNotLinkedError extends Error { constructor(message: string = "OAuth account is not linked to this user.") { super(message); } }
```