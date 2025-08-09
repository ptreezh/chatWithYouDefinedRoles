#!/usr/bin/env node

/**
 * 简化的环境检查和测试脚本
 */

console.log('🔍 环境检查和测试开始...\n');

// 检查Node.js
try {
    const { execSync } = require('child_process');
    const nodeVersion = execSync('node --version', { encoding: 'utf8' });
    console.log(`✅ Node.js版本: ${nodeVersion.trim()}`);
} catch (error) {
    console.log('❌ Node.js未安装或不可用');
    process.exit(1);
}

// 检查npm
try {
    const { execSync } = require('child_process');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' });
    console.log(`✅ npm版本: ${npmVersion.trim()}`);
} catch (error) {
    console.log('❌ npm未安装或不可用');
    process.exit(1);
}

// 检查项目文件
const fs = require('fs');
const path = require('path');

const projectFiles = [
    'package.json',
    'server.ts',
    'src/app/page.tsx',
    'src/lib/chat-service.ts'
];

console.log('\n📁 检查项目文件:');
for (const file of projectFiles) {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 缺失`);
    }
}

// 检查Ollama服务
console.log('\n🤖 检查Ollama服务:');
const http = require('http');

function checkOllama() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 11434,
            path: '/api/tags',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`✅ Ollama服务正常运行`);
                    console.log(`📦 可用模型: ${result.models ? result.models.length : 0} 个`);
                    if (result.models && result.models.length > 0) {
                        console.log(`🤖 模型列表: ${result.models.map(m => m.name).join(', ')}`);
                    }
                    resolve(true);
                } catch (e) {
                    console.log(`❌ Ollama响应解析失败: ${e.message}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Ollama服务连接失败: ${error.message}`);
            console.log(`💡 请确保Ollama已安装并运行: ollama serve`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ Ollama服务请求超时`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// 检查开发服务器
console.log('\n🖥️  检查开发服务器状态:');
function checkDevServer() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET',
            timeout: 3000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`✅ 开发服务器正常运行`);
                    console.log(`📊 状态: ${result.status}`);
                    if (result.database) {
                        console.log(`🗄️  数据库: ${result.database}`);
                    }
                    if (result.ollama) {
                        console.log(`🤖 Ollama集成: ${result.ollama.status}`);
                    }
                    resolve(true);
                } catch (e) {
                    console.log(`❌ 服务器响应解析失败: ${e.message}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ 开发服务器连接失败: ${error.message}`);
            console.log(`💡 请启动开发服务器: npm run dev`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ 开发服务器请求超时`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// 主测试流程
async function runTests() {
    console.log('='.repeat(50));
    
    // 检查Ollama
    const ollamaOk = await checkOllama();
    
    // 检查开发服务器
    const serverOk = await checkDevServer();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 测试总结:');
    
    if (ollamaOk && serverOk) {
        console.log('🎉 环境检查全部通过！');
        console.log('\n🚀 可以运行以下测试:');
        console.log('  npm run test:e2e        # 端到端测试');
        console.log('  npm run test:performance # 性能测试');
        console.log('  npm run test:all         # 完整测试');
        
        console.log('\n📝 启动命令:');
        console.log('  npm run dev              # 启动开发服务器');
        console.log('  然后访问: http://localhost:3000');
        
    } else if (!ollamaOk && !serverOk) {
        console.log('❌ 需要启动以下服务:');
        console.log('  1. Ollama: ollama serve');
        console.log('  2. 开发服务器: npm run dev');
    } else if (!ollamaOk) {
        console.log('❌ 需要启动Ollama: ollama serve');
    } else if (!serverOk) {
        console.log('❌ 需要启动开发服务器: npm run dev');
    }
    
    console.log('\n📋 下一步:');
    console.log('1. 启动所需服务');
    console.log('2. 重新运行此检查脚本');
    console.log('3. 运行自动化测试验证功能');
}

runTests().catch(console.error);