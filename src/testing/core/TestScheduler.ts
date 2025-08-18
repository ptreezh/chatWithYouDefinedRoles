import { BrowserManager } from './BrowserManager'
import { TestExecutionEngine } from './TestExecutionEngine'
import { ReportGenerator } from './ReportGenerator'
import { ConfigManager } from '../config/ConfigManager'
import { ErrorHandler } from './ErrorHandler'
import { ITestScheduler } from '../interfaces'
import { TestConfig, TestExecution, TestStatus, TestResult } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class TestScheduler implements ITestScheduler {
  private activeTests: Map<string, TestExecution> = new Map()
  private testQueue: TestExecution[] = []
  private browserManager: BrowserManager
  private testEngine: TestExecutionEngine
  private reportGenerator: ReportGenerator
  private configManager: ConfigManager
  private errorHandler: ErrorHandler

  constructor() {
    this.browserManager = new BrowserManager()
    this.testEngine = new TestExecutionEngine()
    this.reportGenerator = new ReportGenerator()
    this.configManager = new ConfigManager()
    this.errorHandler = new ErrorHandler()
  }

  async scheduleTest(config: TestConfig): Promise<TestExecution> {
    const execution: TestExecution = {
      id: uuidv4(),
      name: `Test-${Date.now()}`,
      status: 'pending',
      startTime: new Date(),
      config,
      progress: 0
    }

    this.activeTests.set(execution.id, execution)
    this.testQueue.push(execution)

    // 启动测试执行
    this.executeTest(execution)

    return execution
  }

  async cancelTest(executionId: string): Promise<void> {
    const execution = this.activeTests.get(executionId)
    if (execution) {
      execution.status = 'cancelled'
      execution.endTime = new Date()
      this.activeTests.delete(executionId)
    }
  }

  async getTestStatus(executionId: string): Promise<TestStatus> {
    const execution = this.activeTests.get(executionId)
    return execution?.status || 'pending'
  }

  async listActiveTests(): Promise<TestExecution[]> {
    return Array.from(this.activeTests.values())
  }

  async pauseTest(executionId: string): Promise<void> {
    const execution = this.activeTests.get(executionId)
    if (execution && execution.status === 'running') {
      // 实现暂停逻辑
      console.log(`Pausing test ${executionId}`)
    }
  }

  async resumeTest(executionId: string): Promise<void> {
    const execution = this.activeTests.get(executionId)
    if (execution) {
      // 实现恢复逻辑
      console.log(`Resuming test ${executionId}`)
    }
  }

  private async executeTest(execution: TestExecution): Promise<void> {
    try {
      execution.status = 'running'
      execution.progress = 0

      // 加载配置
      const config = await this.configManager.loadConfig()
      
      // 启动浏览器
      const browser = await this.browserManager.launchBrowser('chrome', {
        headless: true,
        viewport: { width: 1920, height: 1080 }
      })

      // 收集所有测试结果
      const allResults: TestResult[] = []

      // 执行UI测试
      if (config.testTypes.includes('ui')) {
        // 这里应该从某个地方加载实际的测试套件
        // 为了演示，我们创建一个简单的测试套件
        const testSuite = {
          name: 'Basic UI Tests',
          tests: [
            {
              name: 'Homepage Load Test',
              description: 'Verify homepage loads correctly',
              steps: [
                {
                  action: 'navigate',
                  value: config.environments[0].baseUrl
                },
                {
                  action: 'wait',
                  selector: '[data-testid="chat-input"]'
                }
              ],
              assertions: [
                {
                  type: 'visible',
                  selector: '[data-testid="chat-input"]',
                  expected: true,
                  message: 'Chat input should be visible'
                }
              ]
            }
          ]
        }
        
        const uiResults = await this.testEngine.executeUITests(browser, testSuite)
        allResults.push(...uiResults)
        execution.progress = 25
      }

      // 执行性能测试
      if (config.testTypes.includes('performance')) {
        const urls = config.environments.map(env => env.baseUrl)
        const perfResults = await this.testEngine.executePerformanceTests(browser, urls)
        // 将性能结果转换为TestResult格式
        const perfTestResults: TestResult[] = perfResults.map(result => ({
          id: uuidv4(),
          testType: 'performance',
          browser: 'chrome',
          environment: config.environments[0].name,
          status: result.metrics.loadTime < 5000 ? 'passed' : 'failed',
          startTime: new Date(),
          endTime: new Date(),
          duration: result.metrics.loadTime,
          metrics: result.metrics
        }))
        allResults.push(...perfTestResults)
        execution.progress = 50
      }

      // 执行可访问性测试
      if (config.testTypes.includes('accessibility')) {
        const urls = config.environments.map(env => env.baseUrl)
        const accessResults = await this.testEngine.executeAccessibilityTests(browser, urls)
        // 将可访问性结果转换为TestResult格式
        const accessTestResults: TestResult[] = accessResults.map(result => ({
          id: uuidv4(),
          testType: 'accessibility',
          browser: 'chrome',
          environment: config.environments[0].name,
          status: result.violations.length === 0 ? 'passed' : 'failed',
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          metrics: { violations: result.violations.length }
        }))
        allResults.push(...accessTestResults)
        execution.progress = 75
      }

      // 执行响应式测试
      if (config.testTypes.includes('responsive')) {
        const breakpoints = [
          { name: 'mobile', width: 375, height: 667, deviceType: 'mobile' as const },
          { name: 'tablet', width: 768, height: 1024, deviceType: 'tablet' as const },
          { name: 'desktop', width: 1920, height: 1080, deviceType: 'desktop' as const }
        ]
        const responsiveResults = await this.testEngine.executeResponsiveTests(browser, breakpoints)
        // 将响应式结果转换为TestResult格式
        const responsiveTestResults: TestResult[] = responsiveResults.map(result => ({
          id: uuidv4(),
          testType: 'responsive',
          browser: 'chrome',
          environment: config.environments[0].name,
          status: result.issues.length === 0 ? 'passed' : 'failed',
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          metrics: { issues: result.issues.length }
        }))
        allResults.push(...responsiveTestResults)
        execution.progress = 90
      }

      // 关闭浏览器
      await this.browserManager.cleanupBrowsers()

      // 生成报告
      const reportPath = await this.reportGenerator.generateHTMLReport(allResults, {
        name: 'default',
        path: 'templates/default.html'
      })

      execution.status = 'completed'
      execution.endTime = new Date()
      execution.progress = 100
      execution.results = allResults

      console.log(`Test execution completed: ${execution.id}`)
      console.log(`Report generated at: ${reportPath}`)
    } catch (error) {
      execution.status = 'failed'
      execution.endTime = new Date()
      console.error(`Test execution failed: ${execution.id}`, error)
    } finally {
      // 清理资源
      setTimeout(() => {
        this.activeTests.delete(execution.id)
      }, 60000) // 1分钟后清理
    }
  }
}