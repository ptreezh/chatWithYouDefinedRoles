#!/usr/bin/env node

/**
 * 简单测试验证脚本 - 验证基本功能
 */

const http = require('http');

console.log('🧪 开始基本功能测试...\n');

async function testEndpoint(path, description) {
    return new Promise((resolve) => {
        console.log(`🔍 测试: ${description}`);
        
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`   ✅ 状态: ${res.statusCode}`);
                    console.log(`   📦 响应: ${JSON.stringify(result).substring(0, 100)}...\n`);
                    resolve({ success: true, status: res.statusCode, data: result });
                } catch (e) {
                    console.log(`   ❌ 解析失败: ${e.message}\n`);
                    resolve({ success: false, status: res.statusCode, error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ 连接失败: ${error.message}\n`);
            resolve({ success: false, error: error.message });
        });

        req.on('timeout', () => {
            console.log(`   ❌ 请求超时\n`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });

        req.end();
    });
}

async function testOllama() {
    console.log('🔍 测试: Ollama服务连接');
    
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
                    console.log(`   ✅ Ollama服务正常`);
                    console.log(`   📦 可用模型: ${result.models ? result.models.length : 0} 个`);
                    if (result.models && result.models.length > 0) {
                        console.log(`   🤖 模型列表: ${result.models.map(m => m.name).join(', ')}`);
                    }
                    console.log('');
                    resolve({ success: true, data: result });
                } catch (e) {
                    console.log(`   ❌ Ollama响应解析失败: ${e.message}\n`);
                    resolve({ success: false, error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Ollama连接失败: ${error.message}`);
            console.log(`   💡 请确保Ollama服务正在运行 (http://localhost:11434)\n`);
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

async function runBasicTests() {
    const results = [];
    
    // 测试Ollama服务
    results.push(await testOllama());
    
    // 测试健康检查端点
    results.push(await testEndpoint('/api/health', '系统健康检查'));
    
    // 测试配置端点
    results.push(await testEndpoint('/api/config', 'API配置'));
    
    // 测试角色端点
    results.push(await testEndpoint('/api/characters', '角色管理'));
    
    // 测试主题端点
    results.push(await testEndpoint('/api/themes', '主题管理'));
    
    // 总结
    const successfulTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log('🎯 测试总结');
    console.log('=' .repeat(40));
    console.log(`总测试数: ${totalTests}`);
    console.log(`成功测试: ${successfulTests}`);
    console.log(`失败测试: ${totalTests - successfulTests}`);
    console.log(`成功率: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    if (successfulTests === totalTests) {
        console.log('\n🎉 所有基本测试通过！系统已准备好进行端到端测试。');
        console.log('\n🚀 下一步命令:');
        console.log('  npm run test:e2e     # 运行端到端测试');
        console.log('  npm run test:performance # 运行性能测试');
        console.log('  npm run test:all      # 运行完整测试套件');
    } else {
        console.log('\n⚠️  部分测试失败，请检查系统配置。');
        console.log('\n🔧 故障排除建议:');
        console.log('  1. 确保开发服务器运行: npm run dev');
        console.log('  2. 确保Ollama服务运行: 检查 http://localhost:11434');
        console.log('  3. 检查端口占用: netstat -an | grep 3000');
    }
    
    return results;
}

// 运行测试
runBasicTests().catch(console.error);