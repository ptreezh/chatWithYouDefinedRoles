# 数据模型设计文档

**任务ID**: TASK-1.2  
**负责人**: 数据架构师  
**开始时间**: 2025-08-20 15:50  
**预计完成**: 2025-08-20 21:50  
**当前状态**: 进行中  

## 📋 概述

基于用户画像需求分析，设计支持用户管理扩充的数据库模型，确保数据结构的扩展性和性能。

## 🗄️ 核心数据模型

### 1. 用户表 (users)

#### 表结构
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  status ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'PENDING',
  role ENUM('USER', 'PREMIUM', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'USER',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
);
```

#### 字段说明
- **id**: 用户唯一标识符
- **email**: 用户邮箱（唯一）
- **name**: 用户显示名称
- **avatar**: 用户头像URL
- **email_verified**: 邮箱验证状态
- **status**: 用户状态（待审核、活跃、非活跃、禁用）
- **role**: 用户角色（普通用户、付费用户、管理员、超级管理员）
- **last_login_at**: 最后登录时间

### 2. 用户画像表 (user_profiles)

#### 表结构
```sql
CREATE TABLE user_profiles (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- 基础信息
  demographics JSON,           -- 人口统计信息
  profession JSON,             -- 职业信息
  interests JSON,              -- 兴趣爱好
  personality JSON,            -- 性格特征
  
  -- 行为特征
  behavior_patterns JSON,      -- 行为模式
  
  -- 偏好设置
  preferences JSON,            -- 用户偏好
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

#### JSON字段结构

##### demographics 字段
```json
{
  "age": 25,
  "gender": "male",
  "location": "Beijing, China",
  "language": ["zh-CN", "en"],
  "timezone": "Asia/Shanghai"
}
```

##### profession 字段
```json
{
  "industry": "technology",
  "role": "software_engineer",
  "experience": 3,
  "skills": ["JavaScript", "React", "Node.js"],
  "company": "Tech Corp",
  "education": "bachelor"
}
```

##### interests 字段
```json
{
  "categories": ["technology", "reading", "music"],
  "tags": ["AI", "web development", "science fiction"],
  "activity_level": "high"
}
```

##### behavior_patterns 字段
```json
{
  "login_frequency": "daily",
  "preferred_features": ["chat", "character_creation"],
  "usage_patterns": {
    "peak_hours": [19, 20, 21],
    "session_duration": 1800,
    "preferred_device_types": ["desktop", "mobile"]
  },
  "interaction_style": "text"
}
```

##### preferences 字段
```json
{
  "communication": {
    "style": "casual",
    "language": "zh-CN",
    "response_length": "detailed"
  },
  "privacy": {
    "profile_visibility": "private",
    "data_collection": true,
    "third_party_sharing": false
  },
  "notifications": {
    "email": true,
    "push": true,
    "frequency": "immediate"
  },
  "ai_preferences": {
    "preferred_roles": ["assistant", "tutor"],
    "interaction_mode": "collaborative",
    "learning_enabled": true
  }
}
```

### 3. 用户设备表 (user_devices)

#### 表结构
```sql
CREATE TABLE user_devices (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) NOT NULL,
  
  device_fingerprint VARCHAR(255) UNIQUE NOT NULL,
  device_info JSON,
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  is_trusted BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_device (user_id, device_fingerprint),
  INDEX idx_device_type (device_type),
  INDEX idx_is_trusted (is_trusted)
);
```

#### device_info 字段结构
```json
{
  "user_agent": "Mozilla/5.0...",
  "screen_resolution": "1920x1080",
  "timezone": "Asia/Shanghai",
  "language": "zh-CN",
  "platform": "Win32",
  "hardware_concurrency": 8,
  "device_memory": 16,
  "color_depth": 24
}
```

### 4. 用户会话表 (user_sessions)

#### 表结构
```sql
CREATE TABLE user_sessions (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) NOT NULL,
  
  token VARCHAR(500) UNIQUE NOT NULL,
  device_id VARCHAR(50),
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE SET NULL,
  INDEX idx_user_token (user_id, token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_active (is_active)
);
```

### 5. 多因素认证配置表 (user_mfa_configs)

#### 表结构
```sql
CREATE TABLE user_mfa_configs (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_secret VARCHAR(255),
  backup_codes JSON,
  
  sms_enabled BOOLEAN DEFAULT FALSE,
  sms_phone_number VARCHAR(20),
  
  email_enabled BOOLEAN DEFAULT FALSE,
  
  recovery_methods JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_totp_enabled (totp_enabled),
  INDEX idx_sms_enabled (sms_enabled)
);
```

#### backup_codes 字段结构
```json
{
  "codes": ["abc123", "def456", "ghi789"],
  "used_codes": ["abc123"],
  "generated_at": "2025-08-20T15:50:00Z"
}
```

### 6. 角色表 (roles)

#### 表结构
```sql
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON[],
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
);
```

#### 预定义角色数据
```sql
INSERT INTO roles (id, name, description, permissions) VALUES
('role_user', 'USER', '普通用户', ['read_profile', 'update_profile', 'create_chat_room']),
('role_premium', 'PREMIUM', '付费用户', ['read_profile', 'update_profile', 'create_chat_room', 'advanced_features', 'api_access']),
('role_admin', 'ADMIN', '管理员', ['read_profile', 'update_profile', 'create_chat_room', 'manage_users', 'system_settings']),
('role_super_admin', 'SUPER_ADMIN', '超级管理员', ['*']);
```

### 7. 用户角色分配表 (user_role_assignments)

#### 表结构
```sql
CREATE TABLE user_role_assignments (
  id VARCHAR(50) PRIMARY KEY DEFAULT cuid(),
  user_id VARCHAR(50) NOT NULL,
  role_id VARCHAR(50) NOT NULL,
  
  assigned_by VARCHAR(50),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE KEY unique_user_role (user_id, role_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id),
  INDEX idx_assigned_at (assigned_at),
  INDEX idx_expires_at (expires_at)
);
```

## 🔍 索引策略

### 性能优化索引
```sql
-- 用户画像查询优化
CREATE INDEX idx_user_profiles_demographics_age ON user_profiles(
  (JSON_EXTRACT(demographics, '$.age'))
);

CREATE INDEX idx_user_profiles_profession_industry ON user_profiles(
  (JSON_EXTRACT(profession, '$.industry'))
);

-- 设备查询优化
CREATE INDEX idx_user_devices_last_used ON user_devices(last_used_at DESC);

-- 会话清理优化
CREATE INDEX idx_user_sessions_expired ON user_sessions(expires_at) WHERE is_active = TRUE;
```

### 全文搜索索引
```sql
-- 用户兴趣搜索
CREATE VIRTUAL TABLE user_profiles_fts USING fts5(
  id,
  user_id,
  interests,
  profession,
  content=user_profiles
);

-- 用户搜索
CREATE VIRTUAL TABLE users_fts USING fts5(
  id,
  email,
  name,
  content=users
);
```

## 📊 数据分区策略

### 时间分区
```sql
-- 用户行为数据按月分区
CREATE TABLE user_behavior_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  action VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202508 VALUES LESS THAN (202509),
    PARTITION p202509 VALUES LESS THAN (202510),
    PARTITION p202510 VALUES LESS THAN (202511),
    PARTITION pmax VALUES LESS THAN MAXVALUE
  )
);
```

## 🔒 安全考虑

### 数据加密
```sql
-- 敏感数据加密存储
ALTER TABLE user_mfa_configs 
ADD COLUMN totp_secret_encrypted TEXT,
ADD COLUMN backup_codes_encrypted TEXT;

-- 创建加密触发器
CREATE TRIGGER encrypt_totp_secret
BEFORE INSERT ON user_mfa_configs
FOR EACH ROW
BEGIN
  SET NEW.totp_secret_encrypted = AES_ENCRYPT(NEW.totp_secret, 'encryption_key');
  SET NEW.totp_secret = NULL;
END;
```

### 数据脱敏
```sql
-- 创建脱敏视图
CREATE VIEW user_profiles_safe AS
SELECT 
  up.id,
  up.user_id,
  up.demographics,
  -- 脱敏处理
  JSON_SET(
    up.profession,
    '$.company',
    CASE 
      WHEN JSON_EXTRACT(up.preferences, '$.privacy.company_visibility') = 'private' 
      THEN '***' 
      ELSE JSON_EXTRACT(up.profession, '$.company')
    END
  ) as profession,
  up.interests,
  up.personality,
  up.behavior_patterns,
  up.preferences,
  up.created_at,
  up.updated_at
FROM user_profiles up;
```

## 📈 性能优化

### 查询优化
```sql
-- 用户画像完整查询
CREATE PROCEDURE get_complete_user_profile(IN user_id VARCHAR(50))
BEGIN
  SELECT 
    u.*,
    up.*,
    GROUP_CONCAT(DISTINCT r.name) as roles,
    COUNT(DISTINCT ud.id) as device_count,
    COUNT(DISTINCT us.id) as active_sessions
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
  LEFT JOIN roles r ON ura.role_id = r.id
  LEFT JOIN user_devices ud ON u.id = ud.user_id AND ud.is_trusted = TRUE
  LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = TRUE AND us.expires_at > NOW()
  WHERE u.id = user_id
  GROUP BY u.id, up.id;
END;
```

### 缓存策略
```sql
-- 创建缓存表
CREATE TABLE user_profile_cache (
  user_id VARCHAR(50) PRIMARY KEY,
  profile_data JSON,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 缓存清理触发器
CREATE TRIGGER update_profile_cache
AFTER UPDATE ON user_profiles
FOR EACH ROW
BEGIN
  DELETE FROM user_profile_cache WHERE user_id = NEW.user_id;
END;
```

## 🔄 数据迁移

### 迁移脚本
```sql
-- 1. 创建新表
-- (上面的表创建语句)

-- 2. 迁移现有用户数据
INSERT INTO users (id, email, name, status, role, created_at, updated_at)
SELECT 
  id,
  email,
  name,
  CASE 
    WHEN email IS NOT NULL THEN 'ACTIVE'
    ELSE 'PENDING'
  END as status,
  'USER' as role,
  created_at,
  updated_at
FROM users_old;

-- 3. 创建默认用户画像
INSERT INTO user_profiles (user_id, demographics, preferences, created_at, updated_at)
SELECT 
  id,
  '{"language": ["zh-CN"]}' as demographics,
  '{"privacy": {"profile_visibility": "private"}, "notifications": {"email": true}}' as preferences,
  created_at,
  updated_at
FROM users
WHERE id NOT IN (SELECT user_id FROM user_profiles);

-- 4. 删除旧表
DROP TABLE users_old;
```

## 📋 验收标准

### 功能验收
- [ ] 所有表结构创建成功
- [ ] 外键约束正确配置
- [ ] 索引创建完成
- [ ] 数据迁移脚本执行成功

### 性能验收
- [ ] 用户画像查询响应时间 < 100ms
- [ ] 设备验证响应时间 < 50ms
- [ ] 会话管理响应时间 < 30ms
- [ ] 并发用户支持1000+

### 安全验收
- [ ] 敏感数据加密存储
- [ ] 访问权限控制正确
- [ ] 数据脱敏功能正常
- [ ] 通过安全测试

---

**文档状态**: 草稿 (需要数据库团队评审)  
**下次更新**: 2025-08-20 18:00  
**评审人员**: 数据库团队负责人