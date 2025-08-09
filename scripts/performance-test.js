#!/usr/bin/env node

/**
 * 性能测试脚本 - 测试本地模型在高并发下的表现
 */

const http = require('http');
const { performance } = require('perf_hooks');

class PerformanceTestRunner {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = [];
        this.concurrentUsers = [1, 5, 10, 20];
        this.testDuration = 30000; // 30秒
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📊';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            
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
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({
                            status: res.statusCode,
                            data: parsed,
                            duration,
                            success: res.statusCode === 200
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData,
                            duration,
                            success: false
                        });
                    }
                });
            });

            req.on('error', (error) => {
                const endTime = performance.now();
                reject({
                    error: error.message,
                    duration: endTime - startTime,
                    success: false
                });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async singleRequestTest() {
        this.log('开始单请求性能测试...');
        
        const testMessages = [
            '请简单介绍一下人工智能',
            '什么是机器学习？',
            '解释一下深度学习的基本概念',
            'AI在现代社会中的应用有哪些？'
        ];

        const results = [];

        for (const message of testMessages) {
            const startTime = performance.now();
            
            try {
                const response = await this.makeRequest({
                    path: '/api/chat/respond',
                    method: 'POST'
                }, {
                    message: message,
                    chatRoomId: 'performance-test',
                    characterId: 'test-character'
                });

                const endTime = performance.now();
                
                results.push({
                    message: message.substring(0, 30) + '...',
                    responseTime: response.duration,
                    success: response.success,
                    responseLength: response.data.response ? response.data.response.length : 0
                });

                this.log(`消息: "${message.substring(0, 20)}..." - 响应时间: ${response.duration.toFixed(2)}ms`);

                // 避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                results.push({
                    message: message.substring(0, 30) + '...',
                    responseTime: error.duration || 0,
                    success: false,
                    error: error.error
                });
                this.log(`请求失败: ${error.error}`, 'error');
            }
        }

        const avgResponseTime = results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
        
        this.log(`单请求测试完成 - 平均响应时间: ${avgResponseTime.toFixed(2)}ms`, 'success');
        
        return {
            type: 'single_request',
            totalRequests: results.length,
            successfulRequests: results.filter(r => r.success).length,
            averageResponseTime: avgResponseTime,
            results: results
        };
    }

    async concurrentTest(concurrentUsers) {
        this.log(`开始并发测试 - ${concurrentUsers} 并发用户`);
        
        const testMessage = '请简单介绍一下人工智能的发展历史';
        const requests = [];
        const startTime = performance.now();

        // 创建并发请求
        for (let i = 0; i < concurrentUsers; i++) {
            requests.push(this.makeRequest({
                path: '/api/chat/respond',
                method: 'POST'
            }, {
                message: `${testMessage} (用户${i + 1})`,
                chatRoomId: 'performance-test',
                characterId: 'test-character'
            }));
        }

        // 等待所有请求完成
        const results = await Promise.allSettled(requests);
        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        const successfulResults = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const failedResults = results.filter(r => r.status === 'rejected' || !r.value.success);

        const avgResponseTime = successfulResults.length > 0 
            ? successfulResults.reduce((sum, r) => sum + r.value.duration, 0) / successfulResults.length
            : 0;

        const throughput = (successfulResults.length / totalDuration) * 1000; // requests per second

        this.log(`并发测试完成 - 成功: ${successfulResults.length}/${requests.length}, 平均响应时间: ${avgResponseTime.toFixed(2)}ms, 吞吐量: ${throughput.toFixed(2)} req/s`);

        return {
            type: 'concurrent_test',
            concurrentUsers: concurrentUsers,
            totalRequests: requests.length,
            successfulRequests: successfulResults.length,
            failedRequests: failedResults.length,
            totalDuration: totalDuration,
            averageResponseTime: avgResponseTime,
            throughput: throughput,
            successRate: (successfulResults.length / requests.length) * 100
        };
    }

    async stressTest() {
        this.log('开始压力测试...');
        
        const duration = 20000; // 20秒
        const startTime = performance.now();
        const requests = [];
        let completedRequests = 0;
        let successfulRequests = 0;

        const testMessages = [
            '什么是AI？',
            '解释机器学习',
            '深度学习的应用',
            'AI的未来发展',
            '神经网络原理'
        ];

        // 持续发送请求
        const interval = setInterval(() => {
            if (performance.now() - startTime >= duration) {
                clearInterval(interval);
                return;
            }

            const message = testMessages[Math.floor(Math.random() * testMessages.length)];
            const requestPromise = this.makeRequest({
                path: '/api/chat/respond',
                method: 'POST'
            }, {
                message: message,
                chatRoomId: 'stress-test',
                characterId: 'test-character'
            }).then(result => {
                completedRequests++;
                if (result.success) successfulRequests++;
                return result;
            }).catch(error => {
                completedRequests++;
                return { success: false, error: error.message };
            });

            requests.push(requestPromise);
        }, 500); // 每500ms发送一个请求

        // 等待测试完成
        await new Promise(resolve => {
            setTimeout(resolve, duration + 5000); // 额外等待5秒完成处理
        });

        const endTime = performance.now();
        const totalDuration = (endTime - startTime) / 1000; // 转换为秒

        const throughput = completedRequests / totalDuration;
        const successRate = (successfulRequests / completedRequests) * 100;

        this.log(`压力测试完成 - 总请求: ${completedRequests}, 成功: ${successfulRequests}, 持续时间: ${totalDuration.toFixed(1)}s, 吞吐量: ${throughput.toFixed(2)} req/s, 成功率: ${successRate.toFixed(1)}%`);

        return {
            type: 'stress_test',
            duration: totalDuration,
            totalRequests: completedRequests,
            successfulRequests: successfulRequests,
            throughput: throughput,
            successRate: successRate
        };
    }

    async testOllamaModels() {
        this.log('测试不同Ollama模型的性能...');
        
        const models = ['llama2', 'mistral', 'codellama'];
        const testMessage = '请用一句话介绍人工智能';
        const results = [];

        for (const model of models) {
            try {
                this.log(`测试模型: ${model}`);
                
                const response = await this.makeRequest({
                    path: '/api/test-api',
                    method: 'POST'
                }, {
                    provider: 'ollama',
                    model: model
                });

                if (response.success) {
                    // 测试生成性能
                    const generateResponse = await this.makeRequest({
                        path: '/api/chat/respond',
                        method: 'POST'
                    }, {
                        message: testMessage,
                        chatRoomId: 'model-test',
                        characterId: 'test-character',
                        modelConfig: JSON.stringify({
                            provider: 'ollama',
                            model: model,
                            temperature: 0.7,
                            maxTokens: 500
                        })
                    });

                    results.push({
                        model: model,
                        available: true,
                        responseTime: generateResponse.duration,
                        responseLength: generateResponse.data.response ? generateResponse.data.response.length : 0
                    });

                    this.log(`${model} - 响应时间: ${generateResponse.duration.toFixed(2)}ms`);
                } else {
                    results.push({
                        model: model,
                        available: false,
                        error: response.data.message
                    });
                    this.log(`${model} - 不可用`, 'error');
                }

            } catch (error) {
                results.push({
                    model: model,
                    available: false,
                    error: error.message
                });
                this.log(`${model} - 测试失败: ${error.message}`, 'error');
            }
        }

        return {
            type: 'model_comparison',
            results: results
        };
    }

    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            tests: results,
            summary: {
                totalTests: results.length,
                avgResponseTime: results.reduce((sum, test) => {
                    if (test.averageResponseTime) {
                        return sum + test.averageResponseTime;
                    }
                    return sum;
                }, 0) / results.filter(t => t.averageResponseTime).length,
                maxThroughput: Math.max(...results.map(t => t.throughput || 0))
            }
        };

        // 保存性能测试报告
        const reportPath = require('path').join(__dirname, '..', 'test-reports', `performance-test-${Date.now()}.json`);
        require('fs').mkdirSync(require('path').dirname(reportPath), { recursive: true });
        require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`性能测试报告已保存: ${reportPath}`, 'success');
        return report;
    }

    async run() {
        this.log('🚀 开始性能测试');
        this.log('=' .repeat(50));

        const results = [];

        try {
            // 1. 单请求性能测试
            results.push(await this.singleRequestTest());
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. 并发测试
            for (const users of this.concurrentUsers) {
                results.push(await this.concurrentTest(users));
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // 3. 压力测试
            results.push(await this.stressTest());
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 4. 模型对比测试
            results.push(await this.testOllamaModels());

        } catch (error) {
            this.log(`性能测试过程中发生异常: ${error.message}`, 'error');
        }

        // 生成测试报告
        const report = this.generateReport(results);

        // 输出测试总结
        this.log('=' .repeat(50));
        this.log('📊 性能测试总结');
        this.log(`平均响应时间: ${report.summary.avgResponseTime.toFixed(2)}ms`);
        this.log(`最大吞吐量: ${report.summary.maxThroughput.toFixed(2)} req/s`);
        this.log(`完成测试数: ${report.summary.totalTests}`);

        return report;
    }
}

// 运行性能测试
if (require.main === module) {
    const testRunner = new PerformanceTestRunner();
    testRunner.run()
        .then(report => {
            console.log('\n性能测试完成！');
        })
        .catch(error => {
            console.error('性能测试失败:', error);
            process.exit(1);
        });
}

module.exports = PerformanceTestRunner;