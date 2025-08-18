# Ollama本地大模型设置指南

## 🎯 问题说明
用户反馈："OLLAMA 本地大模型不需要密码啊，为何有ollama缺少密码的错误"

## 🔧 解决方案

### 1. Ollama本地模型特点
- ✅ **无需API密钥**：Ollama是本地运行的大模型
- ✅ **直接访问**：通过本地HTTP接口访问
- ✅ **免费使用**：开源模型，无使用限制

### 2. 快速设置步骤

#### 步骤1：安装Ollama
```bash
# Windows: 下载安装包 https://ollama.ai/download
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

#### 步骤2：启动模型
您已安装以下模型：
```bash
# 推荐使用的模型
ollama run llama3:latest           # 4.7GB - 通用对话
ollama run qwen3:4b               # 2.6GB - 中文优化
ollama run deepseek-coder:6.7b-instruct  # 3.8GB - 编程助手
ollama run mistral:instruct       # 4.1GB - 英文对话
ollama run qwen:7b-chat           # 4.5GB - 中文对话
```

#### 步骤3：验证服务
```bash
# 检查服务状态
curl http://localhost:11434/api/tags

# 测试文本生成
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "你好，介绍一下自己",
  "stream": false
}'
```

### 3. Chat4项目配置

#### 配置文件更新
编辑 `config/api-config-user.json`:
```json
{
  "provider": "ollama",
  "model": "llama2",
  "baseUrl": "http://localhost:11434",
  "apiKey": null
}
```

#### 运行测试
```bash
# 测试Ollama连接
node scripts/test-ollama-direct.js

# 运行完整E2E测试
node scripts/e2e-test.js
```

### 4. 故障排除

#### 常见问题

**问题1：连接被拒绝**
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```
**解决**：
```bash
# 确保Ollama服务运行
ollama serve
# 或重新启动
ollama run llama2
```

**问题2：模型未找到**
```
Error: model 'llama2' not found
```
**解决**：
```bash
# 拉取模型
ollama pull llama2
```

**问题3：内存不足**
```
Error: out of memory
```
**解决**：
- 使用更小的模型：`ollama run tinyllama`
- 增加系统内存或关闭其他应用

### 5. 验证成功标志

运行测试后应看到：
```
✅ Ollama 本地模型连接成功
✅ Ollama 文本生成成功
✅ 端到端测试通过
```

### 6. 使用场景

| 场景 | 配置 |
|------|------|
| 本地开发 | `provider: "ollama"` |
| 生产环境 | `provider: "zai"` |
| 混合模式 | 根据环境切换 |

### 7. 性能优化

#### 模型选择
- **轻量级**：`tinyllama` (适合低配机器)
- **平衡型**：`llama2` (推荐)
- **高性能**：`mistral` (需要更多内存)

#### 系统要求
- **最低**：4GB RAM, 2GB 显存
- **推荐**：8GB RAM, 4GB 显存
- **理想**：16GB RAM, 8GB 显存

### 8. 一键测试脚本

```bash
# 运行完整验证
npm run test:ollama

# 或手动执行
node scripts/test-ollama-direct.js
```

## 📋 总结

Ollama本地模型完全不需要API密钥，只需：
1. 安装并启动Ollama
2. 运行`ollama run llama2`
3. 配置Chat4使用ollama provider
4. 享受本地免费AI对话！

**记住**：API密钥错误仅适用于云端服务（OpenAI、ZAI等），Ollama是本地服务，永远不需要API密钥。"}}