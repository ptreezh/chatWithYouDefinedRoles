# Chat4 快速启动指南

## 🚀 最简单的启动方法

### 方法1: 直接启动（推荐）
1. 双击 `start.bat`
2. 等待服务启动
3. 浏览器访问 http://localhost:3000

### 方法2: 完整安装
1. 双击 `setup.bat` (首次运行)
2. 双击 `start.bat` 启动服务

## 📋 系统要求

- Windows 10/11
- Node.js 18+ (setup.bat会自动安装)
- 至少2GB内存
- 1GB磁盘空间

## 🔧 常见问题

### 1. 提示"不是内部或外部命令"
- 确保已安装Node.js
- 重新运行setup.bat
- 重启电脑

### 2. 端口被占用
- 关闭其他使用3000端口的程序
- 或修改.env文件中的PORT值

### 3. 依赖安装失败
- 检查网络连接
- 使用管理员权限运行
- 清除node_modules后重试

## 📁 文件说明

- `start.bat` - 启动脚本
- `setup.bat` - 安装脚本
- `portable.bat` - 便携版脚本（复杂）
- `portable-simple.bat` - 简化便携版

## 🌐 访问地址

- 主界面: http://localhost:3000
- 健康检查: http://localhost:3000/api/health

## 🛑 停止服务

关闭命令行窗口即可停止服务