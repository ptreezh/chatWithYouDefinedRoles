# 第一阶段开发指南 - TDD最佳实践 (精简版)

## 🧪 TDD开发流程 (KISS)

### 红-绿-重构循环 (KISS)

#### 1. 红色阶段 (Red) - KISS
- **目标**: 编写能清晰表达功能意图的失败测试。
- **原则**: 一次只写一个刚好能失败的测试，避免过度设计。
- **示例**:
```typescript
// 1. 先写测试 - 此时测试会失败
describe('AuthService', () => {
  it('should register a new user with email and password', async () => {
    // Arrange - 准备最简数据
    const authService = new AuthService(mockUserRepository);
    const userData = { email: 'test@example.com', password: 'password123' };
    
    // Act - 调用待实现的方法
    const result = await authService.register(userData);
    
    // Assert - 验证核心结果
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
    // 注意：这里没有测试bcrypt、邮件发送等复杂细节，专注于核心逻辑
  });
});
```

#### 2. 绿色阶段 (Green) - KISS
- **目标**: 用最简单的方式让测试通过。
- **原则**: 不追求完美代码，先让测试通过，满足当前需求。
- **示例**:
```typescript
// 2. 写最简单的实现让测试通过
class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(userData: { email: string; password: string }) {
    // 暂时不处理复杂逻辑，如密码加密、重复检查等 (YAGNI)
    const user = { id: 'user123', email: userData.email };
    await this.userRepository.create(user);
    return { success: true, user };
  }
}
```

#### 3. 重构阶段 (Refactor) - SOLID
- **目标**: 优化代码结构，提高可读性、可维护性，保持测试通过。
- **原则**: 遵循SOLID原则，特别是单一职责和开闭原则。
- **示例**:
```typescript
// 3. 重构代码，保持测试通过，并引入必要的验证 (不提前引入不必要的复杂性)
class AuthService {
  constructor(
    private userRepository: UserRepository,
    private validator: SimpleUserValidator // 单一职责
  ) {}

  async register(userData: RegisterData): Promise<RegisterResult> { // 使用明确的类型
    // 验证输入 (KISS - 只验证必要项)
    this.validator.validateEmail(userData.email);
    
    // 创建用户 (核心逻辑)
    const user = await this.userRepository.create({
      email: userData.email,
      // 其他必要字段
    });

    return { success: true, user };
  }
}
```

---

## 📋 测试策略 (KISS)

### 测试金字塔 (KISS)

```
         ┌─────────────────┐
         │   E2E Tests     │ ← 10-20% 关键用户流程
         │    (10-20%)     │
         └─────────────────┘
        ┌─────────────────┐
        │ Integration     │ ← 20-30% 服务间交互
        │    Tests        │
        │    (20-30%)     │
        └─────────────────┘
       ┌─────────────────┐
       │   Unit Tests    │ ← 50-70% 核心逻辑 (重点)
       │    (50-70%)     │
       └─────────────────┘
```

### 单元测试最佳实践 (KISS)

#### 测试命名约定 (KISS)
```typescript
// 好的测试命名 - 清晰描述行为和预期
describe('AuthService', () => {
  describe('register', () => {
    it('should successfully register a user with valid email and password', () => {
      // ...
    });
    it('should reject registration with invalid email format', () => {
      // ...
    });
    it('should reject registration with duplicate email', () => {
      // ...
    });
  });
});

// 避免的测试命名 - 模糊不清
describe('AuthService', () => {
  it('test1', () => {});
  it('test register', () => {});
  it('should work', () => {});
});
```

#### 测试结构 (AAA模式 - KISS)
```typescript
describe('AuthService.register', () => {
  it('should successfully register a user with valid data', async () => {
    // Arrange - 准备测试数据和依赖 (Mocks)
    const mockRepo = new MockUserRepository();
    const authService = new AuthService(mockRepo);
    const validUserData = { email: 'test@example.com', password: 'validpass' };
    
    // Act - 执行测试操作 (调用被测方法)
    const result = await authService.register(validUserData);
    
    // Assert - 验证结果 (只验证关键输出)
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }));
  });
});
```

#### Mock和Stub的使用 (KISS)
```typescript
// 使用Mock对象隔离依赖
describe('AuthService', () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let authService: AuthService;
  
  beforeEach(() => {
    // 为每个测试创建干净的Mock (KISS - 只Mock需要的)
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as any; // 简化Mock创建
    
    authService = new AuthService(mockUserRepository);
  });
  
  it('should call repository create method', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    
    await authService.register(userData);
    
    // 验证关键的交互 (KISS - 只验证必要的)
    expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }));
  });
});
```

### 集成测试最佳实践 (KISS)

#### API集成测试 (KISS)
```typescript
// KISS - 只测试核心API路径和关键状态码
describe('Auth API', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = await createTestApp(); // 设置测试应用
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = { email: 'newuser@example.com', password: 'password123' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201); // 关键状态码
      expect(response.body.success).toBe(true); // 关键返回值
      expect(response.body.user.email).toBe('newuser@example.com');
    });
    
    it('should return 400 for invalid email', async () => {
      const invalidData = { email: 'invalid-email', password: 'pass' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);
      
      expect(response.status).toBe(400); // 验证错误处理
    });
  });
});
```

---

## 🏗️ 代码组织结构 (SOLID)

### 项目结构 (遵循SOLID原则)
```
src/
├── modules/
│   ├── auth/                 // 模块化: 按功能划分
│   │   ├── domain/           // 领域模型 (SRP: 聚合相关业务逻辑)
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── application/      // 应用服务 (SRP: 处理用例)
│   │   │   ├── dto/
│   │   │   └── use-cases/
│   │   └── infrastructure/   // 基础设施 (SRP: 处理外部依赖)
│   │       ├── persistence/  // 数据库适配器
│   │       └── controllers/  // API控制器
│   └── ... (其他模块: chat-room, character)
├── shared/                   // 共享内核 (谨慎使用)
│   ├── kernel/               // 核心类型、异常等
│   └── utils/                // 通用工具 (无业务逻辑)
└── app/                      // 应用入口和路由配置
    └── api/
```

---

## 📊 本阶段质量目标 (KISS)

### 测试覆盖率目标
- **单元测试**: ≥ 85% (聚焦核心业务逻辑)
- **集成测试**: ≥ 80% (覆盖核心API路径)
- **端到端测试**: ≥ 70% (覆盖关键用户流程)
- **代码覆盖率**: ≥ 80% (不盲目追求100%)

### 代码质量保证 (SOLID/KISS)
1.  **单一职责 (SRP)**: 每个类/函数只负责一项功能。
2.  **开闭原则 (OCP)**: 对扩展开放，对修改封闭。通过接口和抽象类实现。
3.  **里氏替换 (LSP)**: 子类可以替换父类而不影响程序。
4.  **接口隔离 (ISP)**: 使用细粒度接口，避免胖接口。
5.  **依赖倒置 (DIP)**: 依赖于抽象，而不是具体实现。
6.  **命名规范 (KISS)**: 使用清晰、一致的命名。
7.  **小步快跑 (KISS)**: 每次提交都运行测试，保持主干稳定。

---

## 🎯 最佳实践总结 (KISS/YAGNI/SOLID)

### TDD核心原则
1.  **先写测试 (KISS)**: 在编写功能代码之前先写测试，明确需求。
2.  **小步快跑 (KISS)**: 每次只写一个小的测试，然后实现对应功能。
3.  **持续重构 (SOLID)**: 在保持测试通过的前提下不断优化代码结构。
4.  **测试覆盖 (KISS)**: 确保测试覆盖所有关键功能和边界条件。

### 代码质量保证
1.  **聚焦核心 (YAGNI)**: 只实现当前阶段必需的功能，不要添加“可能有用”的代码。
2.  **模块化设计 (SOLID)**: 通过清晰的模块划分和接口定义，降低耦合度。
3.  **简洁命名 (KISS)**: 代码即文档，好的命名胜过注释。
4.  **团队协作**: 代码审查是保证质量的重要环节。

**开发指南版本**: 1.1 (精简版)
**创建日期**: 2025-08-20
**技术团队**: 多用户认证扩充开发组