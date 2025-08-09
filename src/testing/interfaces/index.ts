// 核心接口定义
import { Browser, Page } from 'playwright'
import {
  TestConfig,
  TestExecution,
  TestStatus,
  BrowserType,
  BrowserOptions,
  BrowserStatus,
  ScreenshotOptions,
  UITestSuite,
  TestResult,
  PerformanceResult,
  AccessibilityResult,
  ResponsiveResult,
  Breakpoint,
  Report,
  ReportTemplate,
  PDFOptions,
  TestError,
  ErrorRecoveryStrategy
} from '../types'

// 测试调度器接口
export interface ITestScheduler {
  scheduleTest(config: TestConfig): Promise<TestExecution>
  cancelTest(executionId: string): Promise<void>
  getTestStatus(executionId: string): Promise<TestStatus>
  listActiveTests(): Promise<TestExecution[]>
  pauseTest(executionId: string): Promise<void>
  resumeTest(executionId: string): Promise<void>
}

// 浏览器管理器接口
export interface IBrowserManager {
  launchBrowser(type: BrowserType, options: BrowserOptions): Promise<Browser>
  closeBrowser(browserId: string): Promise<void>
  getBrowserStatus(browserId: string): Promise<BrowserStatus>
  takeScreenshot(browserId: string, options: ScreenshotOptions): Promise<Buffer>
  listBrowsers(): Promise<BrowserStatus[]>
  cleanupBrowsers(): Promise<void>
}

// 测试执行引擎接口
export interface ITestExecutionEngine {
  executeUITests(browser: Browser, testSuite: UITestSuite): Promise<TestResult[]>
  executePerformanceTests(browser: Browser, urls: string[]): Promise<PerformanceResult[]>
  executeAccessibilityTests(browser: Browser, pages: string[]): Promise<AccessibilityResult[]>
  executeResponsiveTests(browser: Browser, breakpoints: Breakpoint[]): Promise<ResponsiveResult[]>
  executeTest(browser: Browser, test: any): Promise<TestResult>
}

// 报告生成器接口
export interface IReportGenerator {
  generateHTMLReport(results: TestResult[], template: ReportTemplate): Promise<string>
  generatePDFReport(results: TestResult[], options: PDFOptions): Promise<Buffer>
  generateJSONReport(results: TestResult[]): Promise<object>
  sendEmailReport(report: Report, recipients: string[]): Promise<void>
  saveReport(report: Report): Promise<string>
}

// 配置管理器接口
export interface IConfigManager {
  loadConfig(path?: string): Promise<TestConfig>
  saveConfig(config: TestConfig, path?: string): Promise<void>
  validateConfig(config: TestConfig): Promise<boolean>
  getDefaultConfig(): TestConfig
  mergeConfigs(base: TestConfig, override: Partial<TestConfig>): TestConfig
}

// 错误处理器接口
export interface IErrorHandler {
  handleError(error: TestError, strategy: ErrorRecoveryStrategy): Promise<void>
  logError(error: TestError): Promise<void>
  retry<T>(fn: () => Promise<T>, strategy: ErrorRecoveryStrategy): Promise<T>
  notifyError(error: TestError): Promise<void>
}

// 页面对象模型基类接口
export interface IPageObject {
  page: Page
  url: string
  navigate(): Promise<void>
  waitForLoad(): Promise<void>
  takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>
  isElementVisible(selector: string): Promise<boolean>
  clickElement(selector: string): Promise<void>
  typeText(selector: string, text: string): Promise<void>
  getText(selector: string): Promise<string>
}

// 测试数据管理器接口
export interface ITestDataManager {
  generateTestData(type: string, count: number): Promise<any[]>
  loadTestData(path: string): Promise<any>
  saveTestData(data: any, path: string): Promise<void>
  cleanupTestData(): Promise<void>
  seedDatabase(data: any): Promise<void>
}

// 性能监控器接口
export interface IPerformanceMonitor {
  startMonitoring(page: Page): Promise<void>
  stopMonitoring(): Promise<PerformanceResult>
  getMetrics(): Promise<any>
  generateReport(): Promise<string>
}

// 可访问性验证器接口
export interface IAccessibilityValidator {
  runAudit(page: Page): Promise<AccessibilityResult>
  checkColorContrast(page: Page): Promise<any>
  validateKeyboardNavigation(page: Page): Promise<any>
  checkAriaLabels(page: Page): Promise<any>
}

// 设备模拟器接口
export interface IDeviceSimulator {
  setViewport(page: Page, viewport: { width: number; height: number }): Promise<void>
  simulateDevice(page: Page, deviceName: string): Promise<void>
  simulateTouch(page: Page, enabled: boolean): Promise<void>
  getDeviceList(): string[]
}

// WebSocket服务器接口
export interface IWebSocketServer {
  start(port: number): Promise<void>
  stop(): Promise<void>
  broadcast(message: any): void
  sendToClient(clientId: string, message: any): void
  onConnection(callback: (clientId: string) => void): void
  onDisconnection(callback: (clientId: string) => void): void
}

// 数据访问层接口
export interface ITestRepository {
  saveExecution(execution: TestExecution): Promise<string>
  getExecution(id: string): Promise<TestExecution | null>
  updateExecution(id: string, updates: Partial<TestExecution>): Promise<void>
  listExecutions(limit?: number, offset?: number): Promise<TestExecution[]>
  deleteExecution(id: string): Promise<void>
  saveReport(report: Report): Promise<string>
  getReport(id: string): Promise<Report | null>
  listReports(executionId: string): Promise<Report[]>
}

// CI/CD集成接口
export interface ICIIntegration {
  reportToCI(results: TestResult[]): Promise<void>
  createGitHubComment(summary: string): Promise<void>
  updateCommitStatus(status: 'pending' | 'success' | 'failure'): Promise<void>
  uploadArtifacts(files: string[]): Promise<void>
}