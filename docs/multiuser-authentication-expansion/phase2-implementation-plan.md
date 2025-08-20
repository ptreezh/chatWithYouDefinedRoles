# Chat4 多用户认证与并发系统 - 第二阶段实施计划 (精简版)

## 📋 文档信息
- **项目名称**: Chat4 多用户认证与并发系统 (精简版)
- **阶段**: 第二阶段 - 核心聊天室与角色系统
- **版本**: v2.0.1
- **创建日期**: 2025-08-20
- **最后更新**: 2025-08-20
- **目标**: 基于BMAD原则（精简版）和TDD原则，实现核心聊天室和角色管理功能，确保用户数据隔离

---

## 🎯 第二阶段核心目标 (KISS)

### 业务目标
- **私有聊天空间**: 每个用户拥有独立的聊天室，实现数据隔离。
- **角色文件隔离**: 每个用户的角色文件独立存储和管理，确保安全。
- **基础聊天功能**: 实现用户与AI角色在私有聊天室内的基本消息交互。

### 核心价值主张
**"每个用户都拥有自己的、安全隔离的AI角色聊天室"**

---

## 🏗️ 系统架构升级 (SOLID/KISS)

### 核心模块
```
┌─────────────────────────────────────────────────────────────┐
│                    客户端 (浏览器)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    服务端 (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 聊天室服务  │  │ 角色服务    │  │ 消息服务    │        │
│  │ (Prisma)    │  │ (Prisma)    │  │ (Prisma)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  数据库       │      │   缓存      │      │   AI服务    │
│  (SQLite/PG)  │      │  (Redis)    │      │  (Ollama)   │
└───────────────┘      └─────────────┘      └─────────────┘
```

---

## 🔧 核心功能实现 (KISS)

### 1. 聊天室管理
- **创建聊天室**: 用户可以创建新的私有聊天室。
- **列出聊天室**: 用户可以查看自己拥有的所有聊天室。
- **删除聊天室**: 用户可以删除自己的聊天室（软删除）。

### 2. 角色管理 (核心 - 文件隔离)
- **上传/创建角色**: 用户可以上传或创建新的AI角色，文件存储在用户隔离的目录下。
- **列出角色**: 用户可以查看自己拥有的所有角色。
- **更新角色**: 用户可以编辑自己角色的基础信息（名称、系统提示等）。
- **删除角色**: 用户可以删除自己的角色（同时删除关联的文件）。

### 3. 消息系统
- **发送消息**: 用户向聊天室内的AI角色发送消息。
- **接收消息**: 展示AI角色的回复。
- **消息历史**: 查询并展示特定聊天室的历史消息。

---

## 📊 技术实现方案 (SOLID/KISS)

### 数据库设计 (核心隔离)
```sql
-- chat_rooms 表
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

-- characters 表 (角色文件信息与用户关联)
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

-- messages 表
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

### API设计 (核心端点)
```
# 聊天室管理
GET    /api/chat-rooms
POST   /api/chat-rooms
GET    /api/chat-rooms/:id
DELETE /api/chat-rooms/:id

# 角色管理
GET    /api/characters
POST   /api/characters
GET    /api/characters/:id
PUT    /api/characters/:id
DELETE /api/characters/:id

# 消息
GET    /api/chat-rooms/:id/messages
POST   /api/chat-rooms/:id/messages
```

---

## 🚀 实施计划 (TDD驱动, KISS)

### 第3周：后端聊天室与角色核心服务

#### Week 3, Day 1-2: 需求分析与设计 (BMAD - Business/Modeling)
- **任务3.1: 聊天室与角色需求分析 (精简版)**
  - [ ] **负责人**: 产品经理/技术负责人
  - [ ] **时间**: 2小时
  - [ ] **交付物**: 更新后的功能需求文档，明确隔离策略
  - [ ] **验收标准**: 明确聊天室和角色管理的核心功能点及数据隔离方案。

- **任务3.2: 核心数据模型设计与更新**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `chat_rooms`, `characters`, `messages` 表的Prisma Schema
  - [ ] **验收标准**: Schema符合精简和隔离原则，通过评审。

#### Week 3, Day 3-5: 聊天室服务开发 (TDD)
- **任务3.3: 聊天室服务单元测试 (TDD - 红阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `chat-room-service.test.ts` (包含失败的创建、查询、删除测试用例)
  - [ ] **验收标准**: 测试用例覆盖核心聊天室逻辑，当前运行失败。

- **任务3.4: 聊天室服务实现 (TDD - 绿阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 4小时
  - [ ] **交付物**: `chat-room-service.ts` (实现创建、查询、删除聊天室)
  - [ ] **验收标准**: 任务3.3的测试用例全部通过。

- **任务3.5: 聊天室API单元测试 (TDD - 红阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 2小时
  - [ ] **交付物**: `chat-room-api.test.ts` (包含失败的API端点测试)
  - [ ] **验收标准**: 测试覆盖所有聊天室API端点，当前运行失败。

- **任务3.6: 聊天室API实现 (TDD - 绿阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `pages/api/chat-rooms/` 下的相关API路由
  - [ ] **验收标准**: 任务3.5的测试用例全部通过。

### 第4周：角色服务与消息系统开发

#### Week 4, Day 6-8: 角色服务开发 (TDD - 核心隔离)
- **任务4.1: 角色服务单元测试 (TDD - 红阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `character-service.test.ts` (包含失败的角色创建、查询、更新、删除测试)
  - [ ] **验收标准**: 测试用例覆盖核心角色逻辑，特别是文件路径隔离和删除逻辑。

- **任务4.2: 角色服务实现 (TDD - 绿阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 5小时
  - [ ] **交付物**: `character-service.ts` (实现角色的CRUD，包含文件系统操作以保证隔离)
  - [ ] **验收标准**: 任务4.1的测试用例全部通过，角色文件正确存储在用户隔离目录。

- **任务4.3: 角色API单元测试 (TDD - 红阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 2小时
  - [ ] **交付物**: `character-api.test.ts` (包含失败的API端点测试)
  - [ ] **验收标准**: 测试覆盖所有角色API端点。

- **任务4.4: 角色API实现 (TDD - 绿阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `pages/api/characters/` 下的相关API路由
  - [ ] **验收标准**: 任务4.3的测试用例全部通过。

#### Week 4, Day 9-10: 消息服务与集成测试
- **任务4.5: 消息服务单元测试 (TDD - 红阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 2小时
  - [ ] **交付物**: `message-service.test.ts` (包含失败的消息创建、查询测试)
  - [ ] **验收标准**: 测试用例覆盖核心消息逻辑。

- **任务4.6: 消息服务实现 (TDD - 绿阶段)**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: `message-service.ts` (实现消息的存储和查询)
  - [ ] **验收标准**: 任务4.5的测试用例全部通过。

- **任务4.7: 消息API实现**
  - [ ] **负责人**: 后端工程师
  - [ ] **时间**: 2小时
  - [ ] **交付物**: `pages/api/chat-rooms/[id]/messages.ts` 等
  - [ ] **验收标准**: API能正确处理消息的发送和获取。

- **任务4.8: 集成测试**
  - [ ] **负责人**: 测试工程师/后端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: 集成测试报告
  - [ ] **验收标准**: 聊天室、角色、消息服务能协同工作，数据隔离正确。

---

## 🎨 前端界面开发 (KISS)

### Week 4, 并行进行:

#### Week 4, Day 6-10: 前端核心界面开发 (TDD)
- **任务4.9: 聊天室管理界面UI组件 (TDD)**
  - [ ] **负责人**: 前端工程师
  - [ ] **时间**: 4小时
  - [ ] **交付物**: `ChatRoomList.tsx`, `CreateChatRoomModal.tsx`
  - [ ] **验收标准**: 界面能展示聊天室列表，提供创建功能。

- **任务4.10: 角色管理界面UI组件 (TDD)**
  - [ ] **负责人**: 前端工程师
  - [ ] **时间**: 4小时
  - [ ] **交付物**: `CharacterList.tsx`, `UploadCharacterModal.tsx`
  - [ ] **验收标准**: 界面能展示角色列表，提供上传/创建功能。

- **任务4.11: 基础聊天界面UI组件 (TDD)**
  - [ ] **负责人**: 前端工程师
  - [ ] **时间**: 5小时
  - [ ] **交付物**: `ChatInterface.tsx`, `MessageList.tsx`, `MessageInput.tsx`
  - [ ] **验收标准**: 界面能展示消息历史，提供消息输入和发送功能。

- **任务4.12: 前端服务集成**
  - [ ] **负责人**: 前端工程师
  - [ ] **时间**: 3小时
  - [ ] **交付物**: 集成聊天室、角色、消息的前端API调用
  - [ ] **验收标准**: 前端能正确调用后端API，实现完整的用户操作流程。

---

## 📈 成功指标 (KISS)

### 功能指标
- **聊天室管理功能完成率**: 100% (创建, 列表, 删除)
- **角色管理功能完成率**: 100% (上传/创建, 列表, 更新, 删除) - 确保文件隔离
- **消息功能完成率**: 100% (发送, 接收, 历史)
- **API测试通过率**: 100%

### 用户体验指标
- **操作流程**: 创建聊天室、添加角色、开始聊天的流程顺畅。
- **响应时间**: 核心API平均响应时间 < 150ms。

### 技术指标
- **测试覆盖率**: 核心模块单元测试覆盖率 ≥ 85%
- **数据隔离**: 通过测试验证用户A无法访问用户B的数据。
- **代码质量**: 通过ESLint/Prettier检查

---

## 🛡️ 安全与隐私 (KISS)

### 数据隔离
- **强制执行**: 所有API和服务在访问聊天室、角色、消息数据前，必须验证当前用户ID与数据owner_id匹配。
- **文件系统**: 角色文件必须存储在以用户ID命名的隔离目录中。

### 访问控制
- **JWT认证**: 保护所有需要认证的API端点。
- **权限验证**: 服务层严格检查用户对资源的访问权限。

---

## 🧪 测试策略 (TDD)

### 单元测试
- 聊天室服务逻辑
- 角色服务逻辑（重点是文件操作和隔离）
- 消息服务逻辑

### 集成测试
- 聊天室API端点测试
- 角色API端点测试
- 消息API端点测试
- 跨服务数据一致性测试

### E2E测试
- 完整的创建聊天室 -> 上传角色 -> 发送消息流程
- 数据隔离验证测试（用户A尝试访问用户B资源）

---

## 📊 监控与维护 (KISS)

### 基础监控
- 聊天室和角色相关API的请求量和错误率
- 文件系统操作监控（角色上传/删除）
- 数据库查询性能

### 基础日志
- 聊天室和角色操作日志
- 文件系统访问日志
- API访问日志

---

## 🔮 未来扩展 (YAGNI)

当前阶段不涉及以下功能，明确为后续版本规划：
- 复杂的聊天室设置（主题、规则等）
- 多用户共享聊天室
- 角色市场/分享
- 高级消息类型（图片、文件）
- 用户人格标签与沟通方式推荐

---

**文档结束**

本实施计划严格遵循KISS、YAGNI和TDD原则，专注于实现第二阶段的核心聊天室与角色管理功能，并确保用户数据的严格隔离。