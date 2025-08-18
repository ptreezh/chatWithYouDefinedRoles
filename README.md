# Chat4 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-supported-red.svg)](https://ollama.ai/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/chat4/blob/main/CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-Join-7289DA.svg)](https://discord.gg/)
[![GitHub Issues](https://img.shields.io/github/issues/your-username/chat4.svg)](https://github.com/your-username/chat4/issues)

一个现代化的开源AI聊天应用，支持多个AI提供商，包括Ollama本地LLM集成。

## 🌟 核心特性

### 🔒 隐私优先设计
- **本地LLM支持**：通过Ollama运行完全本地的AI模型
- **数据控制**：所有对话数据存储在用户本地
- **无依赖运行**：可选择完全离线运行，无需外部API

### 🤖 多AI提供商支持
- **Ollama集成**：支持Llama 2、Code Llama、Mistral等本地模型
- **OpenAI兼容**：支持GPT-3.5、GPT-4等商业模型
- **Claude集成**：Anthropic Claude模型支持
- **灵活配置**：轻松切换不同AI提供商

### 👥 高级角色管理
- **虚拟角色**：创建和管理多个AI角色
- **角色记忆**：持久化角色对话历史和记忆
- **自定义配置**：为每个角色设置不同的AI模型和参数
- **场景模式**：支持不同对话场景和上下文

### 🧪 企业级测试
- **完整测试套件**：单元测试、集成测试、端到端测试
- **性能测试**：负载测试和响应时间监控
- **自动化测试**：GitHub Actions持续集成
- **代码质量**：ESLint、Prettier代码规范

### 🎨 现代化架构
- **Next.js 15**：最新React框架，支持App Router
- **TypeScript**：完整的类型安全和开发体验
- **Prisma ORM**：类型安全的数据库访问
- **Tailwind CSS**：现代化样式系统
- **实时通信**：Socket.IO实时消息同步

## 🚀 快速开始

### 📋 系统要求
- **Node.js**: 18.0 或更高版本
- **npm**: 最新版本
- **Git**: 用于版本控制
- **Ollama**: 可选，用于本地LLM支持

### 🔧 一键安装

```bash
# 克隆项目
git clone https://github.com/your-username/chat4.git
cd chat4

# 安装依赖
npm install

# 环境配置
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 🏠 本地LLM配置

1. **安装Ollama**
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # 下载安装程序从 https://ollama.ai
   ```

2. **下载模型**
   ```bash
   ollama pull llama2
   ollama pull mistral
   ollama pull codellama
   ```

3. **配置环境变量**
   ```bash
   # 编辑 .env 文件
   NEXT_PUBLIC_USE_OLLAMA=true
   OLLAMA_HOST=http://localhost:11434
   ```

## 📚 文档

### 📖 用户指南
- [🚀 快速开始](docs/user-guide/quick-start.md)
- [🤖 AI提供商配置](docs/user-guide/ai-providers.md)
- [👥 角色管理](docs/user-guide/character-management.md)
- [⚙️ 系统设置](docs/user-guide/settings.md)

### 🔧 开发者文档
- [🏗️ 架构设计](docs/developer/architecture.md)
- [🧪 测试指南](docs/developer/testing.md)
- [📝 API文档](docs/developer/api.md)
- [🚀 部署指南](docs/developer/deployment.md)

### 🚀 部署指南
- [🐳 Docker部署](docs/deployment/docker.md)
- [☁️ 云部署](docs/deployment/cloud.md)
- [🏠 本地部署](docs/deployment/local.md)
- [🔧 环境配置](docs/deployment/environment.md)

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm run test:all

# 运行特定测试
npm run test:e2e        # 端到端测试
npm run test:performance # 性能测试
npm run test:basic       # 基础功能测试
```

### 代码质量
```bash
# 代码检查
npm run lint
npm run type-check

# 格式化
npm run format
```

## 🛠️ 技术栈

### 前端
- **Next.js 15**: React框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: 组件库
- **Socket.IO**: 实时通信

### 后端
- **Next.js API Routes**: API端点
- **Prisma ORM**: 数据库访问
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话

### AI集成
- **Ollama**: 本地LLM
- **OpenAI API**: GPT模型
- **Anthropic API**: Claude模型
- **LangChain**: AI应用框架

## 📊 项目状态

- ✅ **核心功能**: 基础聊天、角色管理、本地LLM
- ✅ **测试覆盖**: 单元测试、集成测试、端到端测试
- ✅ **文档**: 用户指南、开发者文档、API文档
- 🔄 **持续改进**: 性能优化、新功能开发

## 🤝 贡献

我们欢迎所有形式的贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解如何参与项目。

### 贡献方式
- 🐛 [报告Bug](https://github.com/your-username/chat4/issues)
- 💡 [功能请求](https://github.com/your-username/chat4/issues)
- 📖 [文档改进](https://github.com/your-username/chat4/issues)
- 🔧 [代码贡献](CONTRIBUTING.md)

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

- **Next.js团队**: 提供优秀的React框架
- **Ollama团队**: 让本地LLM运行变得简单
- **开源社区**: 所有贡献者和用户

## 📞 社区支持

- 💬 [Discord社区](https://discord.gg/)
- 🐦 [Twitter](https://twitter.com/)
- 📧 [邮件联系](mailto:contact@chat4.com)

---

<div align="center">
  <p><strong>Chat4</strong> - 让AI对话更简单、更私密、更强大</p>
  <p>⭐ 如果这个项目对你有帮助，请给我们一个星标！</p>
</div>
