# 测试策略与质量保证 (精简版)

## 🎯 质量目标 (KISS)

### 测试覆盖率目标 (聚焦核心)
- **单元测试**: ≥ 85% (重点覆盖核心业务逻辑和服务)
- **集成测试**: ≥ 80% (重点覆盖API端点和模块间交互)
- **端到端测试**: ≥ 70% (重点覆盖关键用户流程)
- **代码行覆盖率**: ≥ 80% (不盲目追求100%，关注关键路径)

### 性能目标 (基础)
- **API响应时间**: < 200ms (95th percentile, 核心API)
- **页面加载时间**: < 3秒 (基础页面)
- **系统可用性**: ≥ 99.5% (初期目标)

### 安全目标 (基础)
- **基础漏洞扫描**: 0个高危漏洞 (依赖项、API暴露)
- **认证/授权测试**: 100% 关键路径验证
- **数据传输**: 100% HTTPS
- **敏感数据**: 避免在日志中记录

---

## 🧪 测试策略 (KISS)

### 测试金字塔 (KISS)
```
         ┌─────────────────┐
         │   E2E Tests     │ ← 10-20% 关键用户流程 (如注册登录、创建聊天室)
         │    (10-20%)     │
         └─────────────────┘
        ┌─────────────────┐
        │ Integration     │ ← 20-30% 服务/API交互 (如Auth API, ChatRoom API)
        │    Tests        │
        │    (20-30%)     │
        └─────────────────┘
       ┌─────────────────┐
       │   Unit Tests    │ ← 50-70% 核心逻辑 (如AuthService, ChatRoomService)
       │    (50-70%)     │
       └─────────────────┘
```

### 测试类型 (精简)

#### 1. 单元测试 (KISS - 核心)
```typescript
// 测试配置 (KISS)
const unitTestConfig = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/unit-setup.ts']
}

// 示例测试 (KISS - 聚焦核心逻辑)
describe('AuthService', () => {
  let authService: AuthService
  let mockUserRepository: jest.Mocked<UserRepository>
  
  beforeEach(() => {
    mockUserRepository = { create: jest.fn(), findByEmail: jest.fn() } as any
    authService = new AuthService(mockUserRepository)
  })
  
  describe('register', () => {
    it('should register user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password123' }
      mockUserRepository.create.mockResolvedValue({ id: '1', email: 'test@example.com' })
      
      // Act
      const result = await authService.register(userData)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.user.email).toBe('test@example.com')
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }))
    })
    
    it('should reject invalid email', async () => {
      // Arrange
      const invalidData = { email: 'invalid', password: 'pass' }
      
      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow('Invalid email')
    })
  })
})
```

#### 2. 集成测试 (KISS - API/服务)
```typescript
// 集成测试配置 (KISS)
const integrationTestConfig = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup/integration-setup.ts'],
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts'
}

// API集成测试示例 (KISS)
describe('Auth API Integration', () => {
  let app: Express
  
  beforeAll(async () => {
    app = await createTestApp()
  })
  
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@example.com', password: 'password123' })
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('newuser@example.com')
    })
    
    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'short' })
      
      expect(response.status).toBe(400)
    })
  })
})
```

#### 3. 端到端测试 (KISS - 关键流程)
```typescript
// Playwright配置 (KISS)
const e2eConfig = {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure'
  }
}

// E2E测试示例 (KISS - 关键流程)
test('complete user registration and login flow', async ({ page }) => {
  // 1. Navigate to registration
  await page.goto('/register')
  
  // 2. Fill and submit registration form
  await page.fill('input[name="email"]', 'e2e_test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // 3. Verify successful registration (redirect)
  await expect(page).toHaveURL('/dashboard')
  
  // 4. Logout
  await page.click('button[data-testid="logout"]')
  
  // 5. Login with same credentials
  await page.goto('/login')
  await page.fill('input[name="email"]', 'e2e_test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // 6. Verify successful login
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 🔧 测试自动化 (KISS)

### CI/CD 集成 (KISS)
```yaml
# GitHub Actions 工作流 (KISS)
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
```

---

## 🚀 性能测试 (基础)

### 基础负载测试 (KISS)
```typescript
// K6 基础负载测试脚本 (KISS)
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  // 简单的阶梯式负载
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
}

const BASE_URL = 'http://localhost:3000'

export default function () {
  // User registration
  const registerPayload = JSON.stringify({
    email: `user-${__VU}-${__ITER}@example.com`, // Unique email per VU/iteration
    password: 'password123'
  })
  
  const registerParams = { headers: { 'Content-Type': 'application/json' } }
  const registerResponse = http.post(`${BASE_URL}/api/auth/register`, registerPayload, registerParams)
  check(registerResponse, { 'registration status is 201': (r) => r.status === 201 })
  
  sleep(1)
}
```

---

## 🔒 安全测试 (基础)

### 基础安全扫描 (KISS)
```yaml
# 基础依赖项安全检查
{
  "scripts": {
    "audit": "npm audit --audit-level=high" // 检查高危及以上漏洞
  }
}
```

### 基础渗透测试 (KISS)
```typescript
// 基础安全测试用例 (KISS)
describe('Basic Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInput = { email: "'; DROP TABLE users; --", password: 'password' }
      const response = await request(app).post('/api/auth/login').send(maliciousInput)
      // 应该返回 400 错误，而不是执行了SQL
      expect([400, 401]).toContain(response.status) 
    })
    
    it('should validate JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token'
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${invalidToken}`)
      expect(response.status).toBe(401)
    })
  })
  
  describe('Authorization Security', () => {
    it('should prevent unauthorized access to user data', async () => {
      // 假设我们有两个用户
      const user1Token = await loginUser('user1@example.com')
      // 尝试用user1的token访问一个理论上只有admin能访问的端点
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${user1Token}`)
      expect(response.status).toBe(403) // 应该被拒绝
    })
  })
})
```

---

## 📊 测试报告与监控 (KISS)

### 基础测试报告 (KISS)
```typescript
// 简化的测试报告生成器
class SimpleTestReporter {
  generateSummary(testResults: any) {
    return {
      totalTests: testResults.numTotalTests,
      passedTests: testResults.numPassedTests,
      failedTests: testResults.numFailedTests,
      coverage: this.calculateCoverage(testResults.coverageMap),
      timestamp: new Date().toISOString()
    }
  }
  
  private calculateCoverage(coverageMap: any) {
    // 简化覆盖率计算
    const totalStatements = Object.values(coverageMap).reduce((sum, file) => sum + file.statementMap.length, 0)
    const coveredStatements = Object.values(coverageMap).reduce((sum, file) => sum + file.s.covered, 0)
    return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
  }
}
```

### 持续监控 (KISS)
-   **CI失败**: CI流水线失败时自动通知开发团队。
-   **覆盖率下降**: 当代码提交导致测试覆盖率显著下降时发出警告。
-   **关键性能指标**: 监控API响应时间和错误率，设置基础告警阈值。

---

## 📋 总结

本测试策略与质量保证文档为多用户认证系统扩充提供了**精简且有效的**测试框架。通过聚焦核心功能的多层次测试策略、自动化测试流程，我们能够：

1.  **确保核心代码质量**: 高覆盖率的单元测试和集成测试保障核心逻辑正确。
2.  **验证关键系统功能**: 端到端测试覆盖核心用户流程。
3.  **保障基础性能与安全**: 通过基础的性能测试和安全检查，确保系统上线后的稳定性。
4.  **支持快速迭代**: 简洁高效的测试体系支持敏捷开发和快速交付。

该策略避免了过度工程化，确保在项目初期就能建立坚实的质量基础。

---

**测试策略版本**: 1.1 (精简版)
**创建日期**: 2025-08-20
**测试团队**: 质量保证组