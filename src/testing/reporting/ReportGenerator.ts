# 测试报告生成器

import fs from 'fs/promises'
import path from 'path'

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  details?: any
}

interface TestReport {
  timestamp: string
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
  results: TestResult[]
  performance: {
    avgDuration: number
    maxDuration: number
    minDuration: number
  }
  accessibility: {
    violations: number
    serious: number
    critical: number
  }
}

export class ReportGenerator {
  async generateHTMLReport(report: TestReport): Promise<string> {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat4 测试报告</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                text-align: center;
            }
            .summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .summary-card {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            .summary-card.passed {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
            }
            .summary-card.failed {
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
            }
            .summary-card.skipped {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
            }
            .summary-card h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #666;
            }
            .summary-card .value {
                font-size: 24px;
                font-weight: bold;
            }
            .test-results {
                margin-top: 30px;
            }
            .test-result {
                padding: 15px;
                margin: 10px 0;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }
            .test-result.passed {
                background-color: #d4edda;
                border-left-color: #28a745;
            }
            .test-result.failed {
                background-color: #f8d7da;
                border-left-color: #dc3545;
            }
            .test-result.skipped {
                background-color: #fff3cd;
                border-left-color: #ffc107;
            }
            .test-result h3 {
                margin: 0 0 10px 0;
                color: #333;
            }
            .test-result .details {
                font-size: 14px;
                color: #666;
            }
            .error {
                color: #dc3545;
                font-family: monospace;
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
                white-space: pre-wrap;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .charts {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
            }
            .chart {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Chat4 自动化测试报告</h1>
            <p>生成时间: ${report.timestamp}</p>
            
            <div class="summary">
                <div class="summary-card ${report.summary.passed === report.summary.total ? 'passed' : 'failed'}">
                    <h3>测试通过率</h3>
                    <div class="value">${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>总测试数</h3>
                    <div class="value">${report.summary.total}</div>
                </div>
                <div class="summary-card passed">
                    <h3>通过测试</h3>
                    <div class="value">${report.summary.passed}</div>
                </div>
                <div class="summary-card failed">
                    <h3>失败测试</h3>
                    <div class="value">${report.summary.failed}</div>
                </div>
                <div class="summary-card skipped">
                    <h3>跳过测试</h3>
                    <div class="value">${report.summary.skipped}</div>
                </div>
            </div>
            
            <div class="charts">
                <div class="chart">
                    <h3>性能指标</h3>
                    <p>平均执行时间: ${report.performance.avgDuration.toFixed(2)}ms</p>
                    <p>最长执行时间: ${report.performance.maxDuration.toFixed(2)}ms</p>
                    <p>最短执行时间: ${report.performance.minDuration.toFixed(2)}ms</p>
                </div>
                <div class="chart">
                    <h3>可访问性检查</h3>
                    <p>违反项总数: ${report.accessibility.violations}</p>
                    <p>严重问题: ${report.accessibility.serious}</p>
                    <p>关键问题: ${report.accessibility.critical}</p>
                </div>
            </div>
            
            <div class="test-results">
                <h2>详细测试结果</h2>
                ${report.results.map(result => this.createTestResultHTML(result)).join('')}
            </div>
            
            <div class="footer">
                <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            </div>
        </div>
    </body>
    </html>`

    return html
  }

  private createTestResultHTML(result: TestResult): string {
    return `
    <div class="test-result ${result.status}">
        <h3>${result.name}</h3>
        <div class="details">
            <p>状态: ${result.status === 'passed' ? '✅ 通过' : result.status === 'failed' ? '❌ 失败' : '⚠️ 跳过'}</p>
            <p>耗时: ${result.duration}ms</p>
            ${result.error ? `<div class="error">错误信息: ${result.error}</div>` : ''}
            ${result.details ? `<div class="details">详情: ${JSON.stringify(result.details)}</div>` : ''}
        </div>
    </div>`
  }

  async saveReport(report: TestReport, outputPath: string): Promise<void> {
    const html = await this.generateHTMLReport(report)
    await fs.writeFile(outputPath, html, 'utf-8')
  }
}