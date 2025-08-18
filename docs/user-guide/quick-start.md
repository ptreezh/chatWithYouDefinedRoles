# 🚀 快速开始指南

欢迎使用Chat4！本指南将帮助你在几分钟内启动并运行这个现代化的AI聊天应用。

## 📋 前置要求

在开始之前，请确保你的系统满足以下要求：

- **Node.js**: 18.0 或更高版本
- **npm**: 8.0 或更高版本
- **Git**: 用于克隆项目
- **操作系统**: Windows 10/11, macOS 12+, 或 Linux

## 🔧 安装步骤

### 方法1：一键安装（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your-username/chat4.git
cd chat4

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env  # Windows使用: copy .env.example .env

# 4. 启动开发服务器
npm run dev
```

### 方法2：Docker安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/chat4.git
cd chat4

# 2. 使用Docker Compose启动
docker-compose up -d
```

## 🏠 本地LLM配置（可选）

如果你想使用本地AI模型而不是云端服务，请按照以下步骤配置Ollama：

### 1. 安装Ollama

#### macOS/Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows:
1. 访问 [https://ollama.ai](https://ollama.ai)
2. 下载Windows安装程序
3. 运行安装程序

### 2. 启动Ollama服务
```bash
# 启动Ollama服务
ollama serve
```

### 3. 下载AI模型
```bash
# 下载常用模型
ollama pull llama2
ollama pull mistral
ollama pull codellama
```

### 4. 配置环境变量

编辑 `.env` 文件，添加以下配置：

```env
# 启用本地LLM
NEXT_PUBLIC_USE_OLLAMA=true

# Ollama服务地址
OLLAMA_HOST=http://localhost:11434

# 默认使用的模型
OLLAMA_MODEL=llama2
```

## 🎯 首次使用

### 1. 访问应用

安装完成后，打开浏览器访问：
- **本地地址**: [http://localhost:3000](http://localhost:3000)

### 2. 创建第一个角色

1. 点击左侧菜单的"角色管理"
2. 点击"创建新角色"
3. 填写角色信息：
   - 名称：例如"AI助手"
   - 描述：角色的背景故事
   - AI模型：选择本地或云端模型
4. 保存并开始对话

### 3. 开始对话

1. 选择你创建的角色
2. 在聊天窗口输入你的问题
3. 按Enter或点击发送按钮

## ⚙️ 基本配置

### 环境变量说明

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | 数据库连接 | `file:./db/dev.db` |
| `NEXT_PUBLIC_USE_OLLAMA` | 启用本地LLM | `false` |
| `OLLAMA_HOST` | Ollama服务地址 | `http://localhost:11434` |

### 常用命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm run start

# 运行测试
npm run test:basic
npm run test:all

# 代码检查
npm run lint
```

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口使用情况
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 或修改端口
PORT=3001 npm run dev
```

#### 2. Ollama连接失败
- 确保Ollama服务正在运行：`ollama serve`
- 检查防火墙设置
- 验证Ollama地址配置正确

#### 3. 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除node_modules并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 4. 数据库问题
```bash
# 重置数据库
npm run db:reset

# 生成数据库客户端
npm run db:generate
```

## 📞 获取帮助

如果在安装或使用过程中遇到问题：

1. **查看文档**: [完整文档](https://github.com/your-username/chat4/tree/main/docs)
2. **提交Issue**: [GitHub Issues](https://github.com/your-username/chat4/issues)
3. **社区讨论**: [Discussions](https://github.com/your-username/chat4/discussions)

## 🎉 下一步

现在你已经成功启动了Chat4，可以：

- 📖 阅读[用户指南](character-management.md)了解角色管理
- 🔧 查看[AI提供商配置](ai-providers.md)了解不同AI选项
- 🚀 探索[高级功能](../developer/architecture.md)

享受你的AI对话体验！ 🎊