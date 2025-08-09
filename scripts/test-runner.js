#!/usr/bin/env node

/**
 * 综合测试运行器 - 整合所有测试脚本
 * 支持端到端测试、性能测试、健康检查等
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class TestRunner {
    constructor() {
        this.testResults = [];
        this.reportsDir = path.join(__dirname, '..', 'test-reports');
        this.ensureReportsDir();
    }

    ensureReportsDir() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🧪';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async runCommand(command, options = {}) {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: path.join(__dirname, '..'),
                ...options
            });
            return { success: true, stdout, stderr };
        } catch (error) {
            return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
        }
    }

    async checkServerHealth() {
        this.log('检查服务器健康状态...');
        
        try {
            const response = await fetch('http://localhost:3000/api/health');
            if (response.ok) {
                const data = await response.json();
                this.log('服务器健康检查通过', 'success');
                return { success: true, data };
            } else {
                this.log(`服务器健康检查失败: ${response.status}`, 'error');
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.log(`服务器健康检查异常: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async checkOllamaService() {
        this.log('检查Ollama服务状态...');
        
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (response.ok) {
                const data = await response.json();
                this.log(`Ollama服务正常，发现 ${data.models?.length || 0} 个模型`, 'success');
                return { success: true, data };
            } else {
                this.log(`Ollama服务响应异常: ${response.status}`, 'error');
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.log(`Ollama服务连接失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async startServerIfNeeded() {
        this.log('检查服务器是否需要启动...');
        
        const healthCheck = await this.checkServerHealth();
        if (healthCheck.success) {
            this.log('服务器已在运行');
            return true;
        }

        this.log('尝试启动开发服务器...');
        
        // 启动服务器（后台运行）
        const serverProcess = exec('npm run dev', {
            cwd: path.join(__dirname, '..'),
            detached: true,
            stdio: 'ignore'
        });

        // 等待服务器启动
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const healthCheck = await this.checkServerHealth();
            if (healthCheck.success) {
                this.log('服务器启动成功', 'success');
                this.serverProcess = serverProcess;
                return true;
            }
        }

        this.log('服务器启动失败', 'error');
        return false;
    }

    async runApiTests() {
        this.log('运行API连接测试...');
        
        const result = await this.runCommand('node scripts/test-api.js');
        if (result.success) {
            this.log('API测试完成', 'success');
            return { success: true, output: result.stdout };
        } else {
            this.log(`API测试失败: ${result.error}`, 'error');
            return { success: false, error: result.error };
        }
    }

    async runE2ETests() {
        this.log('运行端到端测试...');
        
        try {
            const E2ETestRunner = require('./e2e-test');
            const testRunner = new E2ETestRunner();
            const report = await testRunner.run();
            
            if (report.summary.failedTests === 0) {
                this.log('端到端测试全部通过', 'success');
            } else {
                this.log(`端到端测试部分失败: ${report.summary.failedTests}/${report.summary.totalTests}`, 'error');
            }
            
            return { success: true, report };
        } catch (error) {
            this.log(`端到端测试异常: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async runPerformanceTests() {
        this.log('运行性能测试...');
        
        try {
            const PerformanceTestRunner = require('./performance-test');
            const testRunner = new PerformanceTestRunner();
            const report = await testRunner.run();
            
            this.log('性能测试完成', 'success');
            return { success: true, report };
        } catch (error) {
            this.log(`性能测试异常: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async runDatabaseTests() {
        this.log('运行数据库测试...');
        
        try {
            // 测试数据库连接
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            await prisma.$connect();
            this.log('数据库连接成功', 'success');
            
            // 测试基本查询
            const characterCount = await prisma.character.count();
            const messageCount = await prisma.message.count();
            
            this.log(`数据库统计: ${characterCount} 个角色, ${messageCount} 条消息`);
            
            await prisma.$disconnect();
            
            return { 
                success: true, 
                stats: { characterCount, messageCount }
            };
        } catch (error) {
            this.log(`数据库测试失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async runMemoryTests() {
        this.log('运行内存系统测试...');
        
        try {
            const response = await fetch('http://localhost:3000/api/memory');
            if (response.ok) {
                const data = await response.json();
                this.log('内存系统测试完成', 'success');
                return { success: true, data };
            } else {
                this.log(`内存系统测试失败: ${response.status}`, 'error');
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.log(`内存系统测试异常: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    generateSummaryReport(results) {
        const summary = {
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            tests: results,
            summary: {
                totalTests: results.length,
                passedTests: results.filter(r => r.success).length,
                failedTests: results.filter(r => !r.success).length,
                successRate: (results.filter(r => r.success).length / results.length * 100).toFixed(1) + '%'
            }
        };

        const reportPath = path.join(this.reportsDir, `test-summary-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

        this.log(`测试总结报告已保存: ${reportPath}`, 'success');
        return summary;
    }

    async cleanup() {
        if (this.serverProcess) {
            this.log('关闭测试服务器...');
            process.kill(-this.serverProcess.pid);
            this.serverProcess = null;
        }
    }

    async run(testTypes = 'all') {
        this.log('🚀 开始综合测试运行');
        this.log('=' .repeat(60));

        const results = [];
        const startTime = Date.now();

        try {
            // 1. 环境检查
            results.push({
                name: '服务器健康检查',
                success: (await this.checkServerHealth()).success
            });

            results.push({
                name: 'Ollama服务检查',
                success: (await this.checkOllamaService()).success
            });

            // 2. 启动服务器（如果需要）
            const serverStarted = await this.startServerIfNeeded();
            if (!serverStarted) {
                this.log('无法启动服务器，跳过后续测试', 'error');
                return this.generateSummaryReport(results);
            }

            // 等待服务器完全启动
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 3. 运行各种测试
            if (testTypes === 'all' || testTypes.includes('api')) {
                const apiResult = await this.runApiTests();
                results.push({
                    name: 'API连接测试',
                    success: apiResult.success
                });
            }

            if (testTypes === 'all' || testTypes.includes('database')) {
                const dbResult = await this.runDatabaseTests();
                results.push({
                    name: '数据库测试',
                    success: dbResult.success
                });
            }

            if (testTypes === 'all' || testTypes.includes('memory')) {
                const memoryResult = await this.runMemoryTests();
                results.push({
                    name: '内存系统测试',
                    success: memoryResult.success
                });
            }

            if (testTypes === 'all' || testTypes.includes('e2e')) {
                const e2eResult = await this.runE2ETests();
                results.push({
                    name: '端到端测试',
                    success: e2eResult.success,
                    report: e2eResult.report
                });
            }

            if (testTypes === 'all' || testTypes.includes('performance')) {
                const perfResult = await this.runPerformanceTests();
                results.push({
                    name: '性能测试',
                    success: perfResult.success,
                    report: perfResult.report
                });
            }

        } catch (error) {
            this.log(`测试运行过程中发生异常: ${error.message}`, 'error');
            results.push({
                name: '意外错误',
                success: false,
                error: error.message
            });
        } finally {
            // 清理资源
            await this.cleanup();
        }

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        // 生成总结报告
        const summary = this.generateSummaryReport(results);

        // 输出测试总结
        this.log('=' .repeat(60));
        this.log('🎯 测试运行总结');
        this.log(`总耗时: ${duration.toFixed(1)}秒`);
        this.log(`测试总数: ${summary.summary.totalTests}`);
        this.log(`通过测试: ${summary.summary.passedTests}`);
        this.log(`失败测试: ${summary.summary.failedTests}`);
        this.log(`成功率: ${summary.summary.successRate}`);

        if (summary.summary.failedTests > 0) {
            this.log('\n❌ 失败的测试:');
            results.filter(r => !r.success).forEach(test => {
                this.log(`  - ${test.name}${test.error ? `: ${test.error}` : ''}`);
            });
        }

        return summary;
    }
}

// 命令行接口
function main() {
    const args = process.argv.slice(2);
    let testTypes = 'all';

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
综合测试运行器

用法:
  node test-runner.js [选项]

选项:
  --help, -h          显示帮助信息
  --api               仅运行API测试
  --e2e               仅运行端到端测试
  --performance       仅运行性能测试
  --database          仅运行数据库测试
  --memory            仅运行内存系统测试

示例:
  node test-runner.js                    # 运行所有测试
  node test-runner.js --e2e --performance  # 运行端到端和性能测试
        `);
        process.exit(0);
    }

    if (args.length > 0) {
        testTypes = args.filter(arg => !arg.startsWith('--')).join(',');
    }

    const testRunner = new TestRunner();
    testRunner.run(testTypes)
        .then(summary => {
            process.exit(summary.summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('测试运行失败:', error);
            process.exit(1);
        });
}

if (require.main === module) {
    main();
}

module.exports = TestRunner;