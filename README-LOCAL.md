# Chat4 本地模型版 - 使用指南

## 🚀 快速启动

### 方法1: 智能启动器 (推荐)
```bash
start-local.bat
```
提供多种启动模式选择，包括开发模式、简化模式、测试等。

### 方法2: 直接启动简化服务器
```bash
node standalone-server.js
```
访问: http://127.0.0.1:6000

### 方法3: 启动完整Next.js应用
```bash
npm run dev
```
访问: http://127.0.0.1:3000

## 🤖 本地模型配置

### 支持的模型服务
- **Ollama** (推荐): http://127.0.0.1:11434
- **LM Studio**: http://127.0.0.1:1234
- **自定义API**: 可配置任意兼容OpenAI API的服务

### 可用模型
系统会自动检测本地安装的模型，包括：
- llama3:latest
- qwen:7b-chat
- mistral:instruct
- deepseek-r1:8b
- phi3:mini
- 等等...

### 安装Ollama模型
```bash
# 安装Ollama (如果尚未安装)
# 访问: https://ollama.com/download

# 安装模型
ollama pull llama3:latest
ollama pull qwen:7b-chat
ollama pull mistral:instruct

# 查看已安装模型
ollama list
```

## 🎯 功能特性

### ✅ 已实现功能
- 🌐 **Web界面**: 现代化的聊天界面
- 🎭 **角色系统**: 丰富的AI角色模板
- 🧠 **记忆系统**: 角色记忆和对话历史
- 🤖 **本地模型**: 支持多种本地AI模型
- 🔧 **模型配置**: 可视化模型参数配置
- 📊 **健康检查**: 完整的系统状态监控
- 🌍 **多语言**: 中文界面，支持中英文对话

### 🔧 API接口
- `GET /api/health` - 系统健康检查
- `GET /api/models` - 获取本地模型列表
- `POST /api/models` - 模型配置管理
- `GET /api/ollama` - Ollama模型操作
- `POST /api/chat/respond` - 聊天对话
- `GET /api/characters` - 角色管理

## 🛠️ 故障排除

### 常见问题

**1. Ollama服务未启动**
```bash
# 启动Ollama服务
ollama serve

# 检查服务状态
curl http://127.0.0.1:11434/api/tags
```

**2. 模型未安装**
```bash
# 安装推荐模型
ollama pull llama3:latest
ollama pull qwen:7b-chat
```

**3. 端口冲突**
- 简化服务器使用6000端口
- Next.js使用3000端口
- Ollama使用11434端口

**4. Node.js环境问题**
```bash
# 修复环境
fix-node-env.bat

# 重新安装依赖
npm install
```

## 📝 配置文件

### API配置
- `config/api-config-user.json` - 用户API配置
- `config/.api-config.json` - 默认API配置

### 角色文件
- `characters/custom/` - 自定义角色
- `characters/categories/` - 分类角色
- `characters/templates/` - 角色模板

## 🎮 使用示例

### 1. 基础对话
1. 启动服务器
2. 访问Web界面
3. 选择角色
4. 开始对话

### 2. 自定义角色
1. 在`characters/custom/`创建角色文件
2. 重启服务器
3. 在界面中选择新角色

### 3. 模型配置
1. 访问模型配置页面
2. 选择本地模型
3. 调整参数
4. 保存配置

## 🔄 更新日志

### v1.0.0 (当前版本)
- ✅ 实现本地模型支持
- ✅ 添加Ollama集成
- ✅ 完善角色管理系统
- ✅ 修复Tailwind CSS配置
- ✅ 优化启动脚本
- ✅ 添加自动化测试

---

## 📞 支持

如有问题，请查看：
1. `diagnose-env.js` - 环境诊断
2. `start-local.bat` - 智能启动器
3. 本文档的故障排除部分