#!/usr/bin/env node

/**
 * 端到端自动化测试脚本 - 基于本地Ollama模型
 * 测试完整的聊天流程：角色管理 -> 主题创建 -> 对话生成
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = [];
        this.currentTheme = 'test-theme-' + Date.now();
        this.testCharacters = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            }, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({
                            status: res.statusCode,
                            data: parsed,
                            raw: responseData
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData,
                            raw: responseData
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async testOllamaConnection() {
        this.log('测试 Ollama 连接（本地模型，无需API密钥）...');
        
        try {
            // 直接测试Ollama本地服务
            const response = await this.makeRequest({
                path: '/api/test-api',
                method: 'POST'
            }, {
                provider: 'ollama',
                model: 'llama3:latest', // 使用实际下载的模型
                baseUrl: 'http://localhost:11434',
                // Ollama本地模型不需要API密钥
                apiKey: null
            });

            if (response.status === 200 && response.data.success) {
                this.log('Ollama 本地模型连接成功', 'success');
                return true;
            } else {
                this.log(`Ollama 连接失败: ${response.data.message || '检查模型是否安装：ollama run llama3:latest'}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`Ollama 连接异常: ${error.message}`, 'error');
            this.log('💡 请确保Ollama已安装并运行：', 'info');
            this.log('1. 安装Ollama: https://ollama.ai', 'info');
            this.log('2. 运行命令: ollama run llama2', 'info');
            this.log('3. 验证服务: curl http://localhost:11434/api/tags', 'info');
            return false;
        }
    }

    async createTestTheme() {
        this.log(`创建测试主题: ${this.currentTheme}`);
        
        try {
            const response = await this.makeRequest({
                path: '/api/themes',
                method: 'POST'
            }, {
                themeName: this.currentTheme
            });

            if (response.status === 200) {
                this.log('测试主题创建成功', 'success');
                return response.data.theme;
            } else {
                this.log(`主题创建失败: ${response.data.error}`, 'error');
                return null;
            }
        } catch (error) {
            this.log(`主题创建异常: ${error.message}`, 'error');
            return null;
        }
    }

    async createTestCharacter() {
        this.log('创建测试角色...');
        
        const testCharacter = {
            name: '测试助手',
            systemPrompt: `你是一个专业的测试助手，专门用于验证聊天系统的功能。
你的特点：
1. 回答简洁明了
2. 专注于技术测试
3. 提供准确的反馈
4. 保持专业的态度`,
            participationLevel: 0.8,
            interestThreshold: 0.3,
            category: 'test'
        };

        try {
            const response = await this.makeRequest({
                path: '/api/characters',
                method: 'POST'
            }, testCharacter);

            if (response.status === 200) {
                const character = response.data;
                this.testCharacters.push(character);
                this.log(`测试角色创建成功: ${character.name}`, 'success');
                return character;
            } else {
                this.log(`角色创建失败: ${response.data.error}`, 'error');
                return null;
            }
        } catch (error) {
            this.log(`角色创建异常: ${error.message}`, 'error');
            return null;
        }
    }

    async initializeChat() {
        this.log('初始化聊天室...');
        
        try {
            const response = await this.makeRequest({
                path: '/api/init',
                method: 'GET'
            });

            if (response.status === 200) {
                this.log('聊天室初始化成功', 'success');
                return response.data;
            } else {
                this.log(`聊天室初始化失败: ${response.data.error}`, 'error');
                return null;
            }
        } catch (error) {
            this.log(`聊天室初始化异常: ${error.message}`, 'error');
            return null;
        }
    }

    async testChatFlow() {
        this.log('开始聊天流程测试...');
        
        const testMessages = [
            '你好，我想了解一下AI测试的基本概念',
            '什么是自动化测试？',
            '请解释一下端到端测试的重要性',
            '测试中常见的挑战有哪些？'
        ];

        const chatResults = [];

        for (const message of testMessages) {
            this.log(`发送测试消息: "${message}"`);
            
            try {
                // 评估角色兴趣
                const evaluationResponse = await this.makeRequest({
                    path: '/api/chat/evaluate',
                    method: 'POST'
                }, {
                    topic: message,
                    chatRoomId: this.chatRoom?.id || 'test-chat-room',
                    characterId: this.testCharacters[0]?.id || 'test-character'
                });

                if (evaluationResponse.status !== 200) {
                    this.log(`兴趣评估失败: ${evaluationResponse.data.error}`, 'error');
                    continue;
                }

                const evaluation = evaluationResponse.data.evaluation;
                this.log(`兴趣评估结果: ${evaluation.score} (${evaluation.shouldParticipate ? '参与' : '不参与'})`);

                if (!evaluation.shouldParticipate) {
                    this.log('角色选择不参与此话题，跳过');
                    continue;
                }

                // 生成回复
                const responseResponse = await this.makeRequest({
                    path: '/api/chat/respond',
                    method: 'POST'
                }, {
                    message: message,
                    chatRoomId: this.chatRoom?.id || 'test-chat-room',
                    characterId: this.testCharacters[0]?.id || 'test-character'
                });

                if (responseResponse.status === 200) {
                    const response = responseResponse.data.response;
                    this.log(`回复生成成功 (${response.length} 字符)`, 'success');
                    
                    chatResults.push({
                        message,
                        response: response.substring(0, 100) + '...',
                        evaluationScore: evaluation.score,
                        responseLength: response.length
                    });

                    // 避免请求过于频繁
                    await this.delay(1000);
                } else {
                    this.log(`回复生成失败: ${responseResponse.data.error}`, 'error');
                }

            } catch (error) {
                this.log(`聊天测试异常: ${error.message}`, 'error');
            }
        }

        return chatResults;
    }

    async testMemorySystem() {
        this.log('测试记忆系统...');
        
        try {
            const response = await this.makeRequest({
                path: '/api/memory',
                method: 'GET'
            }, {
                characterId: this.testCharacters[0]?.id
            });

            if (response.status === 200) {
                this.log('记忆系统测试成功', 'success');
                return response.data;
            } else {
                this.log(`记忆系统测试失败: ${response.data.error}`, 'error');
                return null;
            }
        } catch (error) {
            this.log(`记忆系统测试异常: ${error.message}`, 'error');
            return null;
        }
    }

    async cleanupTestData() {
        this.log('清理测试数据...');
        
        try {
            // 删除测试角色
            for (const character of this.testCharacters) {
                await this.makeRequest({
                    path: `/api/characters/${character.id}`,
                    method: 'DELETE'
                });
            }

            // 删除测试主题
            await this.makeRequest({
                path: `/api/themes?theme=${encodeURIComponent(this.currentTheme)}`,
                method: 'DELETE'
            });

            this.log('测试数据清理完成', 'success');
        } catch (error) {
            this.log(`清理测试数据异常: ${error.message}`, 'error');
        }
    }

    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            testTheme: this.currentTheme,
            summary: {
                totalTests: Object.keys(results).length,
                passedTests: Object.values(results).filter(r => r.success).length,
                failedTests: Object.values(results).filter(r => !r.success).length
            },
            details: results,
            chatResults: this.chatResults,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };

        // 保存测试报告
        const reportPath = path.join(__dirname, '..', 'test-reports', `e2e-test-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`测试报告已保存: ${reportPath}`, 'success');
        return report;
    }

    async run() {
        this.log('🚀 开始端到端自动化测试');
        this.log('=' .repeat(50));

        const results = {};
        this.chatResults = [];

        try {
            // 1. 测试Ollama连接
            results.ollamaConnection = {
                name: 'Ollama连接测试',
                success: await this.testOllamaConnection()
            };

            if (!results.ollamaConnection.success) {
                this.log('Ollama连接失败，跳过后续测试', 'error');
                return this.generateReport(results);
            }

            // 2. 创建测试主题
            results.themeCreation = {
                name: '主题创建测试',
                success: await this.createTestTheme() !== null
            };

            // 3. 创建测试角色
            results.characterCreation = {
                name: '角色创建测试',
                success: await this.createTestCharacter() !== null
            };

            // 4. 初始化聊天室
            const initResult = await this.initializeChat();
            results.chatInitialization = {
                name: '聊天室初始化测试',
                success: initResult !== null
            };

            if (initResult) {
                this.chatRoom = initResult.chatRoom;
            }

            // 5. 测试聊天流程
            if (this.testCharacters.length > 0) {
                this.chatResults = await this.testChatFlow();
                results.chatFlow = {
                    name: '聊天流程测试',
                    success: this.chatResults.length > 0,
                    messagesTested: this.chatResults.length,
                    responsesGenerated: this.chatResults.filter(r => r.response).length
                };
            }

            // 6. 测试记忆系统
            results.memorySystem = {
                name: '记忆系统测试',
                success: await this.testMemorySystem() !== null
            };

        } catch (error) {
            this.log(`测试过程中发生异常: ${error.message}`, 'error');
            results.unexpectedError = {
                name: '意外错误',
                success: false,
                error: error.message
            };
        } finally {
            // 清理测试数据
            await this.cleanupTestData();
        }

        // 生成测试报告
        const report = this.generateReport(results);

        // 输出测试总结
        this.log('=' .repeat(50));
        this.log('🎯 测试总结');
        this.log(`总测试数: ${report.summary.totalTests}`);
        this.log(`通过测试: ${report.summary.passedTests}`);
        this.log(`失败测试: ${report.summary.failedTests}`);
        this.log(`成功率: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);

        if (this.chatResults.length > 0) {
            this.log(`聊天测试: ${this.chatResults.length} 条消息，${this.chatResults.filter(r => r.response).length} 条回复`);
        }

        return report;
    }
}

// 运行测试
if (require.main === module) {
    const testRunner = new E2ETestRunner();
    testRunner.run()
        .then(report => {
            process.exit(report.summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('测试运行失败:', error);
            process.exit(1);
        });
}

module.exports = E2ETestRunner;