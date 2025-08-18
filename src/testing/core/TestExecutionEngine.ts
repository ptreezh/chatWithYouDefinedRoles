import { Browser, Page } from 'playwright'
import { ITestExecutionEngine } from '../interfaces'
import {
  UITestSuite,
  TestResult,
  PerformanceResult,
  AccessibilityResult,
  ResponsiveResult,
  Breakpoint,
  TestError,
  UITest,
  UITestStep,
  UIAssertion
} from '../types'
import { v4 as uuidv4 } from 'uuid'

export class TestExecutionEngine implements ITestExecutionEngine {
  async executeUITests(browser: Browser, testSuite: UITestSuite): Promise<TestResult[]> {
    const results: TestResult[] = []
    const context = await browser.newContext()
    
    try {
      for (const test of testSuite.tests) {
        const result = await this.executeUITest(context, test)
        results.push(result)
      }
    } finally {
      await context.close()
    }
    
    return results
  }

  async executePerformanceTests(browser: Browser, urls: string[]): Promise<PerformanceResult[]> {
    const results: PerformanceResult[] = []
    const context = await browser.newContext()
    
    try {
      for (const url of urls) {
        const page = await context.newPage()
        try {
          const result = await this.measurePerformance(page, url)
          results.push(result)
        } finally {
          await page.close()
        }
      }
    } finally {
      await context.close()
    }
    
    return results
  }

  async executeAccessibilityTests(browser: Browser, pages: string[]): Promise<AccessibilityResult[]> {
    const results: AccessibilityResult[] = []
    const context = await browser.newContext()
    
    try {
      for (const url of pages) {
        const page = await context.newPage()
        try {
          // 注入axe-core库
          await page.addScriptTag({ path: require.resolve('axe-core') })
          await page.goto(url)
          
          // 运行可访问性检查
          const axeResults = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
              // @ts-ignore
              axe.run((err, results) => {
                if (err) reject(err)
                else resolve(results)
              })
            })
          })
          
          const result: AccessibilityResult = {
            url,
            violations: axeResults.violations,
            passes: axeResults.passes,
            incomplete: axeResults.incomplete,
            score: axeResults.score,
            level: 'AA' // 简化处理，实际应该根据检查结果确定
          }
          
          results.push(result)
        } finally {
          await page.close()
        }
      }
    } finally {
      await context.close()
    }
    
    return results
  }

  async executeResponsiveTests(browser: Browser, breakpoints: Breakpoint[]): Promise<ResponsiveResult[]> {
    const results: ResponsiveResult[] = []
    const context = await browser.newContext()
    
    try {
      for (const breakpoint of breakpoints) {
        const page = await context.newPage()
        try {
          // 设置视口尺寸
          await page.setViewportSize({
            width: breakpoint.width,
            height: breakpoint.height
          })
          
          // 导航到测试页面
          await page.goto('http://localhost:3000') // 使用默认URL，实际应该可配置
          
          // 等待页面加载
          await page.waitForLoadState('networkidle')
          
          // 截图
          const screenshot = await page.screenshot({
            fullPage: true
          })
          
          // 保存截图到文件
          const screenshotPath = `reports/screenshots/${Date.now()}-${breakpoint.name}.png`
          // 这里应该实际保存文件，暂时省略
          
          const result: ResponsiveResult = {
            breakpoint,
            viewport: { width: breakpoint.width, height: breakpoint.height },
            screenshots: [screenshotPath],
            issues: [], // 简化处理，实际应该检测响应式问题
            layoutShift: 0 // 简化处理，实际应该测量布局偏移
          }
          
          results.push(result)
        } finally {
          await page.close()
        }
      }
    } finally {
      await context.close()
    }
    
    return results
  }

  async executeTest(browser: Browser, test: any): Promise<TestResult> {
    // 通用测试执行方法，可以根据测试类型调用相应的专用方法
    throw new Error('Method not implemented.')
  }

  private async executeUITest(context: any, test: UITest): Promise<TestResult> {
    const page = await context.newPage()
    const startTime = new Date()
    let error: TestError | undefined
    
    try {
      // 执行测试步骤
      for (const step of test.steps) {
        await this.executeStep(page, step)
      }
      
      // 执行断言
      for (const assertion of test.assertions) {
        await this.executeAssertion(page, assertion)
      }
      
      // 如果没有异常，则测试通过
      return {
        id: uuidv4(),
        testType: 'ui',
        browser: 'chrome', // 简化处理，实际应该从context获取
        environment: 'local', // 简化处理，实际应该可配置
        status: 'passed',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        screenshots: [] // 简化处理，实际应该在需要时截图
      }
    } catch (err) {
      error = {
        message: err.message,
        stack: err.stack,
        code: err.code
      }
      
      return {
        id: uuidv4(),
        testType: 'ui',
        browser: 'chrome',
        environment: 'local',
        status: 'failed',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        error,
        screenshots: []
      }
    } finally {
      await page.close()
    }
  }

  private async executeStep(page: Page, step: UITestStep): Promise<void> {
    switch (step.action) {
      case 'navigate':
        if (step.value) {
          await page.goto(step.value)
        }
        break
      case 'click':
        if (step.selector) {
          await page.click(step.selector, { timeout: step.timeout })
        }
        break
      case 'type':
        if (step.selector && step.value) {
          await page.fill(step.selector, step.value, { timeout: step.timeout })
        }
        break
      case 'wait':
        if (step.value) {
          await page.waitForTimeout(parseInt(step.value))
        } else if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: step.timeout })
        }
        break
      case 'scroll':
        // 简化处理，实际应该根据options滚动到指定位置
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        break
      case 'hover':
        if (step.selector) {
          await page.hover(step.selector, { timeout: step.timeout })
        }
        break
      default:
        throw new Error(`Unsupported step action: ${step.action}`)
    }
  }

  private async executeAssertion(page: Page, assertion: UIAssertion): Promise<void> {
    switch (assertion.type) {
      case 'visible':
        if (assertion.selector) {
          const isVisible = await page.isVisible(assertion.selector)
          if (!isVisible) {
            throw new Error(assertion.message || `Element ${assertion.selector} is not visible`)
          }
        }
        break
      case 'hidden':
        if (assertion.selector) {
          const isHidden = await page.isHidden(assertion.selector)
          if (!isHidden) {
            throw new Error(assertion.message || `Element ${assertion.selector} is not hidden`)
          }
        }
        break
      case 'text':
        if (assertion.selector) {
          const text = await page.textContent(assertion.selector)
          if (text !== assertion.expected) {
            throw new Error(assertion.message || `Text "${text}" does not match expected "${assertion.expected}"`)
          }
        }
        break
      case 'value':
        if (assertion.selector) {
          const value = await page.inputValue(assertion.selector)
          if (value !== assertion.expected) {
            throw new Error(assertion.message || `Value "${value}" does not match expected "${assertion.expected}"`)
          }
        }
        break
      case 'count':
        if (assertion.selector) {
          const count = await page.locator(assertion.selector).count()
          if (count !== assertion.expected) {
            throw new Error(assertion.message || `Element count ${count} does not match expected ${assertion.expected}`)
          }
        }
        break
      case 'attribute':
        if (assertion.selector) {
          // 简化处理，实际应该检查特定属性
          const hasAttribute = await page.hasAttribute(assertion.selector, 'class')
          if (!hasAttribute) {
            throw new Error(assertion.message || `Element ${assertion.selector} does not have expected attribute`)
          }
        }
        break
      default:
        throw new Error(`Unsupported assertion type: ${assertion.type}`)
    }
  }

  private async measurePerformance(page: Page, url: string): Promise<PerformanceResult> {
    // 启用性能监控
    await page.goto(url)
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    
    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      const paint = performance.getEntriesByType('paint')
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find((p: any) => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find((p: any) => p.name === 'first-contentful-paint')?.startTime
      }
    })
    
    return {
      url,
      metrics: {
        loadTime: metrics.loadTime,
        domContentLoaded: metrics.domContentLoaded,
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint
      }
    }
  }
}