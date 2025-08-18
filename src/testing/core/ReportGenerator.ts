import { IReportGenerator } from '../interfaces'
import {
  TestResult,
  PerformanceResult,
  AccessibilityResult,
  ResponsiveResult,
  Report,
  ReportTemplate,
  PDFOptions,
  ReportFormat,
  ReportType
} from '../types'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs/promises'
import * as path from 'path'

export class ReportGenerator implements IReportGenerator {
  private reportsDir: string

  constructor(reportsDir: string = 'reports') {
    this.reportsDir = reportsDir
  }

  async generateHTMLReport(results: TestResult[], template: ReportTemplate): Promise<string> {
    // 创建报告目录
    await this.ensureReportsDir()
    
    // 生成HTML内容
    const htmlContent = this.createHTMLReport(results)
    
    // 保存报告到文件
    const fileName = `report-${Date.now()}.html`
    const filePath = path.join(this.reportsDir, fileName)
    await fs.writeFile(filePath, htmlContent, 'utf-8')
    
    return filePath
  }

  async generatePDFReport(results: TestResult[], options: PDFOptions): Promise<Buffer> {
    // PDF报告生成功能需要额外的依赖（如Puppeteer或pdfkit）
    // 这里提供一个简化的实现
    throw new Error('PDF report generation not implemented')
  }

  async generateJSONReport(results: TestResult[]): Promise<object> {
    // 创建报告目录
    await this.ensureReportsDir()
    
    // 生成JSON内容
    const reportData = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(results),
      results
    }
    
    // 保存报告到文件
    const fileName = `report-${Date.now()}.json`
    const filePath = path.join(this.reportsDir, fileName)
    await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf-8')
    
    return reportData
  }

  async sendEmailReport(report: Report, recipients: string[]): Promise<void> {
    // 邮件发送功能需要配置SMTP服务器
    // 这里提供一个简化的实现
    console.log(`Sending report to ${recipients.join(', ')}`)
    console.log(`Report content: ${report.content.substring(0, 100)}...`)
  }

  async saveReport(report: Report): Promise<string> {
    // 创建报告目录
    await this.ensureReportsDir()
    
    // 确定文件扩展名
    let extension = '.txt'
    switch (report.format) {
      case 'html':
        extension = '.html'
        break
      case 'pdf':
        extension = '.pdf'
        break
      case 'json':
        extension = '.json'
        break
      case 'csv':
        extension = '.csv'
        break
    }
    
    // 生成文件名
    const fileName = `report-${report.id}-${Date.now()}${extension}`
    const filePath = path.join(this.reportsDir, fileName)
    
    // 保存报告内容到文件
    await fs.writeFile(filePath, report.content, 'utf-8')
    
    return filePath
  }

  private async ensureReportsDir(): Promise<void> {
    try {
      await fs.access(this.reportsDir)
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true })
    }
  }

  private createHTMLReport(results: TestResult[]): string {
    const summary = this.generateSummary(results)
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自动化测试报告</title>
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
    </style>
</head>
<body>
    <div class="container">
        <h1>自动化测试报告</h1>
        <div class="summary">
            <div class="summary-card ${summary.passedTests === summary.totalTests ? 'passed' : 'failed'}">
                <h3>测试通过率</h3>
                <div class="value">${summary.passRate.toFixed(1)}%</div>
            </div>
            <div class="summary-card">
                <h3>总测试数</h3>
                <div class="value">${summary.totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>通过测试</h3>
                <div class="value">${summary.passedTests}</div>
            </div>
            <div class="summary-card failed">
                <h3>失败测试</h3>
                <div class="value">${summary.failedTests}</div>
            </div>
            <div class="summary-card">
                <h3>平均耗时</h3>
                <div class="value">${summary.averageDuration.toFixed(2)}ms</div>
            </div>
        </div>
        
        <div class="test-results">
            <h2>详细测试结果</h2>
            ${results.map(result => this.createTestResultHTML(result)).join('')}
        </div>
        
        <div class="footer">
            <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`
  }

  private createTestResultHTML(result: TestResult): string {
    return `
<div class="test-result ${result.status}">
    <h3>${result.testType} 测试 - ${result.browser} - ${result.environment}</h3>
    <div class="details">
        <p>状态: ${result.status === 'passed' ? '✅ 通过' : '❌ 失败'}</p>
        <p>耗时: ${result.duration}ms</p>
        <p>开始时间: ${result.startTime.toLocaleString('zh-CN')}</p>
        <p>结束时间: ${result.endTime.toLocaleString('zh-CN')}</p>
        ${result.error ? `<div class="error">错误信息: ${result.error.message}\n${result.error.stack}</div>` : ''}
    </div>
</div>`
  }

  private generateSummary(results: TestResult[]): {
    totalTests: number,
    passedTests: number,
    failedTests: number,
    passRate: number,
    averageDuration: number
  } {
    const totalTests = results.length
    const passedTests = results.filter(r => r.status === 'passed').length
    const failedTests = results.filter(r => r.status === 'failed').length
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests
    
    return {
      totalTests,
      passedTests,
      failedTests,
      passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      averageDuration
    }
  }
}