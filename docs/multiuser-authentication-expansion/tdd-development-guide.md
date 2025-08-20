# 第一阶段开发指南 - TDD最佳实践

## 🧪 TDD开发流程

### 红-绿-重构循环

#### 1. 红色阶段 (Red)
- **编写失败的测试**
- **定义功能需求**
- **明确接口设计**

```typescript
// 1. 先写测试 - 此时测试会失败
describe('UserProfileService', () => {
  it('should create user profile with valid data', async () => {
    const service = new UserProfileService(mockRepository)
    const profileData = {
      demographics: { age: 25, gender: 'male' },
      profession: { industry: 'tech', role: 'developer' }
    }
    
    const result = await service.createProfile('user123', profileData)
    
    expect(result).toBeDefined()
    expect(result.userId).toBe('user123')
  })
})
```

#### 2. 绿色阶段 (Green)
- **编写最简单的实现代码**
- **让测试通过**
- **不追求完美代码**

```typescript
// 2. 写最简单的实现让测试通过
class UserProfileService {
  constructor(private repository: UserProfileRepository) {}
  
  async createProfile(userId: string, data: any): Promise<any> {
    return {
      userId,
      ...data,
      createdAt: new Date()
    }
  }
}
```

#### 3. 重构阶段 (Refactor)
- **优化代码结构**
- **提高代码质量**
- **确保测试仍然通过**

```typescript
// 3. 重构代码，保持测试通过
class UserProfileService {
  constructor(
    private repository: UserProfileRepository,
    private validator: ProfileValidator
  ) {}
  
  async createProfile(userId: string, data: CreateProfileData): Promise<UserProfile> {
    this.validator.validate(data)
    
    const profile = await this.repository.create({
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return profile
  }
}
```

---

## 📋 测试策略

### 测试金字塔

```
         ┌─────────────────┐
         │   E2E Tests     │ ← 10% 用户流程测试
         │    (10%)        │
         └─────────────────┘
        ┌─────────────────┐
        │ Integration     │ ← 30% 服务间交互测试
        │    Tests        │
        │    (30%)        │
        └─────────────────┘
       ┌─────────────────┐
       │   Unit Tests    │ ← 60% 核心逻辑测试
       │    (60%)        │
       └─────────────────┘
```

### 单元测试最佳实践

#### 测试命名约定
```typescript
// 好的测试命名
describe('UserProfileService', () => {
  describe('createProfile', () => {
    it('should create profile with valid data', () => {})
    it('should throw error with invalid age', () => {})
    it('should validate required fields', () => {})
  })
})

// 避免的测试命名
describe('UserProfileService', () => {
  it('test1', () => {})
  it('test profile', () => {})
  it('should work', () => {})
})
```

#### 测试结构 (AAA模式)
```typescript
describe('UserProfileService', () => {
  it('should create profile with valid data', async () => {
    // Arrange - 准备测试数据
    const service = new UserProfileService(mockRepository)
    const profileData = {
      demographics: { age: 25, gender: 'male' },
      profession: { industry: 'tech', role: 'developer' }
    }
    
    // Act - 执行测试操作
    const result = await service.createProfile('user123', profileData)
    
    // Assert - 验证结果
    expect(result).toBeDefined()
    expect(result.userId).toBe('user123')
    expect(result.demographics.age).toBe(25)
  })
})
```

#### Mock和Stub的使用
```typescript
// 使用Mock对象
describe('UserProfileService', () => {
  let mockRepository: MockUserProfileRepository
  let service: UserProfileService
  
  beforeEach(() => {
    mockRepository = new MockUserProfileRepository()
    service = new UserProfileService(mockRepository)
  })
  
  it('should call repository create method', async () => {
    const profileData = {
      demographics: { age: 25, gender: 'male' },
      profession: { industry: 'tech', role: 'developer' }
    }
    
    await service.createProfile('user123', profileData)
    
    expect(mockRepository.create).toHaveBeenCalledWith({
      userId: 'user123',
      ...profileData,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })
})
```

### 集成测试最佳实践

#### API集成测试
```typescript
describe('UserProfile API', () => {
  let app: Express
  let testUser: TestUser
  
  beforeAll(async () => {
    app = await createTestApp()
    testUser = await createTestUser()
  })
  
  describe('POST /api/user-profiles', () => {
    it('should create user profile', async () => {
      const profileData = {
        demographics: { age: 25, gender: 'male' },
        profession: { industry: 'tech', role: 'developer' }
      }
      
      const response = await request(app)
        .post('/api/user-profiles')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(profileData)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe(testUser.id)
    })
    
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/user-profiles')
        .send({})
      
      expect(response.status).toBe(401)
    })
  })
})
```

#### 数据库集成测试
```typescript
describe('UserProfileRepository Integration', () => {
  let repository: UserProfileRepository
  let testDatabase: TestDatabase
  
  beforeAll(async () => {
    testDatabase = new TestDatabase()
    await testDatabase.setup()
    repository = new UserProfileRepository(testDatabase.connection)
  })
  
  afterAll(async () => {
    await testDatabase.teardown()
  })
  
  beforeEach(async () => {
    await testDatabase.clear()
  })
  
  it('should create and retrieve user profile', async () => {
    const profileData = {
      userId: 'user123',
      demographics: { age: 25, gender: 'male' },
      profession: { industry: 'tech', role: 'developer' }
    }
    
    const created = await repository.create(profileData)
    const retrieved = await repository.findByUserId('user123')
    
    expect(retrieved).toEqual(expect.objectContaining(profileData))
  })
})
```

### 端到端测试最佳实践

#### Playwright E2E测试
```typescript
test('complete user profile setup flow', async ({ page }) => {
  // 用户登录
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  // 验证登录成功
  await expect(page).toHaveURL('/dashboard')
  
  // 进入用户画像设置
  await page.click('[data-testid="profile-settings"]')
  
  // 填写基本信息
  await page.fill('[data-testid="age"]', '25')
  await page.selectOption('[data-testid="gender"]', 'male')
  await page.fill('[data-testid="location"]', 'Beijing')
  
  // 保存设置
  await page.click('[data-testid="save-profile"]')
  
  // 验证保存成功
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

---

## 🏗️ 代码组织结构

### 项目结构
```
src/
├── modules/
│   └── user-profile/
│       ├── __tests__/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── domain/
│       │   ├── models/
│       │   ├── services/
│       │   └── repositories/
│       ├── application/
│       │   ├── dto/
│       │   ├── controllers/
│       │   └── middleware/
│       └── infrastructure/
│           ├── database/
│           ├── cache/
│           └── external/
└── shared/
    ├── utils/
    ├── constants/
    └── types/
```

### 测试文件组织
```
tests/
├── unit/
│   ├── UserProfileService.test.ts
│   ├── UserProfileRepository.test.ts
│   └── UserProfileValidator.test.ts
├── integration/
│   ├── UserProfileAPI.test.ts
│   ├── UserProfileDatabase.test.ts
│   └── UserProfileCache.test.ts
├── e2e/
│   ├── UserProfileSetup.test.ts
│   ├── UserProfileManagement.test.ts
│   └── UserProfileSecurity.test.ts
└── setup/
    ├── test-setup.ts
    ├── database-setup.ts
    └── mock-factories.ts
```

---

## 🔧 工具配置

### Jest配置
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### 测试工具配置
```typescript
// tests/setup/test-setup.ts
import { jest } from '@jest/globals'

// 全局测试设置
global.beforeEach(() => {
  jest.clearAllMocks()
})

// Mock环境变量
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.REDIS_URL = 'redis://localhost:6379'

// 全局Mock
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }))
}))
```

### Playwright配置
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 📊 测试数据管理

### 测试数据工厂
```typescript
// tests/setup/factories/UserProfileFactory.ts
export class UserProfileFactory {
  static create(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
      id: generateId(),
      userId: generateId(),
      demographics: {
        age: 25,
        gender: 'male',
        location: 'Beijing',
        language: ['zh-CN']
      },
      profession: {
        industry: 'technology',
        role: 'developer',
        experience: 3
      },
      interests: ['programming', 'reading'],
      preferences: {
        communicationStyle: 'casual',
        privacyLevel: 'private'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }
  
  static createMany(count: number, overrides: Partial<UserProfile> = {}): UserProfile[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}
```

### 测试数据库设置
```typescript
// tests/setup/DatabaseTestSetup.ts
export class DatabaseTestSetup {
  private connection: DatabaseConnection
  
  async setup(): Promise<void> {
    this.connection = await createTestConnection()
    await this.runMigrations()
    await this.seedData()
  }
  
  async teardown(): Promise<void> {
    await this.clearDatabase()
    await this.connection.close()
  }
  
  private async runMigrations(): Promise<void> {
    await this.connection.migrate.latest()
  }
  
  private async seedData(): Promise<void> {
    // 种子测试数据
    const users = UserProfileFactory.createMany(5)
    await this.connection('user_profiles').insert(users)
  }
  
  private async clearDatabase(): Promise<void> {
    const tables = ['user_profiles', 'user_sessions', 'user_devices']
    for (const table of tables) {
      await this.connection(table).truncate()
    }
  }
}
```

---

## 🚀 CI/CD集成

### GitHub Actions配置
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd redis-cli ping
          --health-interval 10s
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results
          path: playwright-report/
```

### 质量门禁
```yaml
# 质量检查配置
quality-gates:
  test-coverage:
    unit: 90
    integration: 85
    e2e: 80
    
  code-quality:
    eslint-score: 90
    security-score: 100
    
  performance:
    response-time: 200
    error-rate: 1
```

---

## 📈 测试报告和分析

### 测试报告生成
```typescript
// scripts/generate-test-report.ts
import { TestReportGenerator } from '../src/utils/TestReportGenerator'

async function generateTestReport() {
  const generator = new TestReportGenerator()
  
  const report = await generator.generateReport({
    includeUnitTests: true,
    includeIntegrationTests: true,
    includeE2ETests: true,
    includePerformanceTests: true
  })
  
  await generator.saveReport(report, 'test-report.html')
  await generator.uploadToCI(report)
}

generateTestReport().catch(console.error)
```

### 测试趋势分析
```typescript
// utils/TestTrendAnalyzer.ts
export class TestTrendAnalyzer {
  analyzeTrend(historicalData: TestResult[]): TestTrend {
    const trends = {
      coverage: this.calculateTrend(historicalData.map(d => d.coverage)),
      passRate: this.calculateTrend(historicalData.map(d => d.passRate)),
      performance: this.calculateTrend(historicalData.map(d => d.performance))
    }
    
    return {
      overall: this.calculateOverallTrend(trends),
      details: trends,
      recommendations: this.generateRecommendations(trends)
    }
  }
  
  private calculateTrend(values: number[]): TrendDirection {
    const recent = values.slice(-5)
    const older = values.slice(-10, -5)
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    if (recentAvg > olderAvg * 1.05) return 'improving'
    if (recentAvg < olderAvg * 0.95) return 'declining'
    return 'stable'
  }
}
```

---

## 🎯 最佳实践总结

### TDD核心原则
1. **先写测试**: 在编写功能代码之前先写测试
2. **小步快跑**: 每次只写一个小的测试，然后实现对应功能
3. **持续重构**: 在保持测试通过的前提下不断优化代码
4. **测试覆盖**: 确保测试覆盖所有关键功能

### 代码质量保证
1. **命名规范**: 使用清晰的测试命名和结构
2. **单一职责**: 每个测试只测试一个功能点
3. **独立性**: 测试之间相互独立，不依赖执行顺序
4. **可重复性**: 测试应该在任何环境下都能重复运行

### 团队协作
1. **代码审查**: 所有代码都需要经过审查
2. **持续集成**: 每次提交都运行完整测试套件
3. **文档维护**: 保持测试文档和API文档的同步
4. **知识共享**: 定期分享TDD经验和最佳实践

---

**开发指南版本**: 1.0  
**创建日期**: 2025-08-20  
**技术团队**: 多用户认证扩充开发组