# API接口设计文档

**任务ID**: TASK-1.3  
**负责人**: API架构师  
**开始时间**: 2025-08-20 16:35  
**预计完成**: 2025-08-20 20:35  
**当前状态**: 进行中  

## 📋 概述

基于用户画像需求和数据模型设计，设计RESTful API接口，确保接口的一致性、安全性和可扩展性。

## 🔧 API设计原则

### RESTful设计
- **资源导向**: 以资源为中心的URL设计
- **HTTP方法**: 正确使用GET、POST、PUT、DELETE
- **状态码**: 使用正确的HTTP状态码
- **版本控制**: 支持API版本控制

### 安全设计
- **认证**: JWT Token认证
- **授权**: 基于角色的访问控制
- **验证**: 输入数据验证和清理
- **限流**: API调用频率限制

### 性能设计
- **缓存**: 合理的缓存策略
- **分页**: 大数据集分页
- **字段选择**: 支持字段选择
- **批量操作**: 支持批量操作

## 📚 API端点设计

### 1. 用户画像管理 API

#### 获取用户画像
```http
GET /api/v1/user/profile
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "profile_123",
    "userId": "user_123",
    "demographics": {
      "age": 25,
      "gender": "male",
      "location": "Beijing, China",
      "language": ["zh-CN", "en"]
    },
    "profession": {
      "industry": "technology",
      "role": "software_engineer",
      "experience": 3,
      "skills": ["JavaScript", "React", "Node.js"]
    },
    "interests": ["technology", "reading", "music"],
    "personality": ["analytical", "creative", "curious"],
    "behaviorPatterns": {
      "loginFrequency": "daily",
      "preferredFeatures": ["chat", "character_creation"],
      "usagePatterns": {
        "peakHours": [19, 20, 21],
        "sessionDuration": 1800,
        "preferredDeviceTypes": ["desktop", "mobile"]
      },
      "interactionStyle": "text"
    },
    "preferences": {
      "communication": {
        "style": "casual",
        "language": "zh-CN",
        "responseLength": "detailed"
      },
      "privacy": {
        "profileVisibility": "private",
        "dataCollection": true,
        "thirdPartySharing": false
      },
      "notifications": {
        "email": true,
        "push": true,
        "frequency": "immediate"
      },
      "aiPreferences": {
        "preferredRoles": ["assistant", "tutor"],
        "interactionMode": "collaborative",
        "learningEnabled": true
      }
    },
    "createdAt": "2025-08-20T16:35:00Z",
    "updatedAt": "2025-08-20T16:35:00Z"
  }
}
```

#### 创建/更新用户画像
```http
PUT /api/v1/user/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "demographics": {
    "age": 25,
    "gender": "male",
    "location": "Beijing, China",
    "language": ["zh-CN", "en"]
  },
  "profession": {
    "industry": "technology",
    "role": "software_engineer",
    "experience": 3,
    "skills": ["JavaScript", "React", "Node.js"]
  },
  "interests": ["technology", "reading", "music"],
  "personality": ["analytical", "creative", "curious"],
  "preferences": {
    "communication": {
      "style": "casual",
      "language": "zh-CN",
      "responseLength": "detailed"
    },
    "privacy": {
      "profileVisibility": "private",
      "dataCollection": true,
      "thirdPartySharing": false
    }
  }
}
```

#### 部分更新用户画像
```http
PATCH /api/v1/user/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "preferences": {
    "notifications": {
      "email": false,
      "frequency": "daily"
    }
  }
}
```

### 2. 设备管理 API

#### 注册设备
```http
POST /api/v1/user/devices
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "deviceName": "My Laptop",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "screenResolution": "1920x1080",
    "timezone": "Asia/Shanghai",
    "language": "zh-CN",
    "platform": "Win32",
    "hardwareConcurrency": 8,
    "deviceMemory": 16
  }
}
```

#### 获取用户设备列表
```http
GET /api/v1/user/devices
Authorization: Bearer <token>
```

#### 信任设备
```http
POST /api/v1/user/devices/{deviceId}/trust
Authorization: Bearer <token>
```

#### 删除设备
```http
DELETE /api/v1/user/devices/{deviceId}
Authorization: Bearer <token>
```

### 3. 会话管理 API

#### 创建会话
```http
POST /api/v1/auth/sessions
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100"
  }
}
```

#### 获取活跃会话
```http
GET /api/v1/user/sessions
Authorization: Bearer <token>
```

#### 终止会话
```http
DELETE /api/v1/user/sessions/{sessionId}
Authorization: Bearer <token>
```

#### 终止所有其他会话
```http
DELETE /api/v1/user/sessions/others
Authorization: Bearer <token>
```

### 4. 多因素认证 API

#### 获取MFA配置
```http
GET /api/v1/user/mfa
Authorization: Bearer <token>
```

#### 启用TOTP
```http
POST /api/v1/user/mfa/totp/enable
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["abc123", "def456", "ghi789"]
  }
}
```

#### 验证TOTP
```http
POST /api/v1/user/mfa/totp/verify
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "token": "123456"
}
```

#### 禁用TOTP
```http
POST /api/v1/user/mfa/totp/disable
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "password": "current_password"
}
```

### 5. 用户角色管理 API

#### 获取用户角色
```http
GET /api/v1/user/roles
Authorization: Bearer <token>
```

#### 分配角色
```http
POST /api/v1/user/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例**:
```json
{
  "userId": "user_123",
  "roleId": "role_premium",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### 移除角色
```http
DELETE /api/v1/user/roles/{userId}/{roleId}
Authorization: Bearer <token>
```

### 6. 用户搜索 API

#### 搜索用户
```http
GET /api/v1/users/search?q=query&limit=20&offset=0
Authorization: Bearer <token>
```

**查询参数**:
- `q`: 搜索关键词
- `limit`: 返回结果数量限制 (默认: 20, 最大: 100)
- `offset`: 偏移量 (默认: 0)
- `fields`: 返回字段 (可选, 如: `id,name,email`)

## 🔍 数据验证

### 输入验证规则

#### 用户画像验证
```typescript
interface UserProfileValidation {
  demographics: {
    age: { min: 13, max: 120 }
    gender: { enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
    location: { maxLength: 100 }
    language: { maxLength: 10, each: { maxLength: 5 } }
  }
  profession: {
    industry: { maxLength: 50 }
    role: { maxLength: 50 }
    experience: { min: 0, max: 50 }
    skills: { maxLength: 20, each: { maxLength: 30 } }
  }
  interests: { maxLength: 50, each: { maxLength: 30 } }
  personality: { maxLength: 10, each: { maxLength: 20 } }
}
```

#### 设备信息验证
```typescript
interface DeviceInfoValidation {
  deviceName: { maxLength: 100 }
  deviceInfo: {
    userAgent: { maxLength: 500 }
    screenResolution: { pattern: /^\d+x\d+$/ }
    timezone: { maxLength: 50 }
  }
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "demographics.age",
        "message": "Age must be between 13 and 120"
      }
    ]
  }
}
```

## 🚀 分页和过滤

### 分页格式
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 过滤参数
- `filter[key]`: 字段过滤
- `sort`: 排序字段 (如: `createdAt.desc`)
- `fields`: 字段选择 (如: `id,name,email`)

## 🔐 安全机制

### 认证中间件
```typescript
interface AuthMiddleware {
  authenticate(req: Request, res: Response, next: NextFunction): void
  authorize(permission: string): (req: Request, res: Response, next: NextFunction) => void
  rateLimit(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void
}
```

### 权限检查
```typescript
interface PermissionCheck {
  // 用户画像权限
  READ_PROFILE: 'read_profile'
  UPDATE_PROFILE: 'update_profile'
  DELETE_PROFILE: 'delete_profile'
  
  // 设备管理权限
  MANAGE_DEVICES: 'manage_devices'
  
  // 会话管理权限
  MANAGE_SESSIONS: 'manage_sessions'
  
  // 用户管理权限
  MANAGE_USERS: 'manage_users'
  ASSIGN_ROLES: 'assign_roles'
}
```

## 📊 监控和日志

### API监控
```typescript
interface APIMonitoring {
  requestCount: number
  responseTime: number
  errorRate: number
  endpoint: string
  method: string
  statusCode: number
}
```

### 审计日志
```typescript
interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  details: Record<string, any>
}
```

## 🔄 版本控制

### API版本策略
- **URL版本**: `/api/v1/`, `/api/v2/`
- **向后兼容**: v1 API保持兼容
- **废弃通知**: 提前6个月通知API废弃

### 版本头信息
```http
API-Version: v1
Content-Type: application/vnd.api.v1+json
```

## 📋 实现优先级

### Phase 1 (Week 1-2)
- [ ] 用户画像管理 API
- [ ] 基础设备管理 API
- [ ] 认证和授权中间件

### Phase 2 (Week 3-4)
- [ ] 完整设备管理 API
- [ ] 会话管理 API
- [ ] 多因素认证 API

### Phase 3 (后续)
- [ ] 用户角色管理 API
- [ ] 高级搜索 API
- [ ] 批量操作 API

---

**文档状态**: 草稿 (需要技术团队评审)  
**下次更新**: 2025-08-20 18:00  
**评审人员**: 技术架构师、后端开发负责人