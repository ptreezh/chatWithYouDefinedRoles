#!/usr/bin/env node

/**
 * 直接测试Ollama本地模型 - 无需API密钥
 * 验证本地Ollama服务是否正常运行
 */

const http = require('http');

class OllamaTester {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.testPrompt = '你好，请简单介绍一下人工智能的基本概念。';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async testOllamaHealth() {
        this.log('测试Ollama服务健康状态...');
        
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
                        const parsed = JSON.parse(data);
                        this.log(`Ollama服务正常，可用模型: ${parsed.models?.length || 0}个`, 'success');
                        resolve({ success: true, models: parsed.models || [] });
                    } catch (e) {
                        this.log('Ollama服务响应格式错误', 'error');
                        resolve({ success: false, error: 'Invalid response format' });
                    }
                });
            });

            req.on('error', (error) => {
                this.log(`Ollama服务连接失败: ${error.message}`, 'error');
                resolve({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                this.log('Ollama服务连接超时', 'error');
                resolve({ success: false, error: 'Connection timeout' });
            });

            req.end();
        });
    }

    async testOllamaGeneration() {
        this.log('测试Ollama文本生成...');
        
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.response) {
                            this.log('Ollama文本生成成功', 'success');
                            this.log(`回复预览: ${parsed.response.substring(0, 100)}...`);
                            resolve({ success: true, response: parsed.response });
                        } else {
                            this.log('Ollama文本生成无响应内容', 'error');
                            resolve({ success: false, error: 'No response content' });
                        }
                    } catch (e) {
                        this.log('Ollama文本生成响应格式错误', 'error');
                        resolve({ success: false, error: 'Invalid response format' });
                    }
                });
            });

            req.on('error', (error) => {
                this.log(`Ollama文本生成失败: ${error.message}`, 'error');
                resolve({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                this.log('Ollama文本生成超时', 'error');
                resolve({ success: false, error: 'Generation timeout' });
            });

            const payload = {
                model: 'llama3:latest',
                prompt: this.testPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 200
                }
            };

            req.write(JSON.stringify(payload));
            req.end();
        });
    }

    async runCompleteTest() {
        console.log('🚀 开始Ollama本地模型测试（无需API密钥）\n');

        const healthResult = await this.testOllamaHealth();
        
        if (healthResult.success) {
            const generationResult = await this.testOllamaGeneration();
            
            if (generationResult.success) {
                console.log('\n✅ Ollama本地模型测试全部通过！');
                console.log('📋 测试结果总结:');
                console.log('- 服务状态: 正常');
                console.log(`- 可用模型: ${healthResult.models.length}个`);
                console.log('- 文本生成: 正常');
                console.log('- API密钥: 不需要');
                return true;
            } else {
                console.log('\n❌ Ollama文本生成测试失败');
                console.log(`错误: ${generationResult.error}`);
                return false;
            }
        } else {
            console.log('\n❌ Ollama服务未运行');
            console.log(`错误: ${healthResult.error}`);
            console.log('💡 请确保:');
            console.log('1. Ollama已安装并运行');
            console.log('2. 执行: ollama run llama2');
            console.log('3. 检查端口11434是否开放');
            return false;
        }
    }
}

// 执行测试
if (require.main === module) {
    const tester = new OllamaTester();
    tester.runCompleteTest()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('测试异常:', error);
            process.exit(1);
        });
}

module.exports = OllamaTester;