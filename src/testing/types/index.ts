// 核心类型定义

export type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari'
export type TestType = 'ui' | 'performance' | 'accessibility' | 'responsive'
export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ReportFormat = 'html' | 'pdf' | 'json' | 'csv'
export type ReportType = 'summary' | 'detailed' | 'performance' | 'accessibility'

export interface ViewportSize {
  width: number
  height: number
}

export interface BrowserOptions {
  headless: boolean
  viewport: ViewportSize
  userAgent?: string
  locale?: string
  timezone?: string
}

export interface BrowserStatus {
  id: string
  type: BrowserType
  status: 'launching' | 'ready' | 'busy' | 'closing' | 'closed'
  pid?: number
  memory?: number
  cpu?: number
}

export interface ScreenshotOptions {
  fullPage?: boolean
  quality?: number
  format?: 'png' | 'jpeg'
  clip?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface TestConfig {
  testTypes: TestType[]
  browsers: BrowserType[]
  environments: Environment[]
  schedule?: string // Cron expression
  notifications: NotificationConfig
  timeout?: number
  retries?: number
  parallel?: boolean
  maxConcurrency?: number
}

export interface Environment {
  name: string
  baseUrl: string
  credentials?: {
    username: string
    password: string
  }
}

export interface NotificationConfig {
  email?: {
    enabled: boolean
    recipients: string[]
    smtp: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
    }
  }
  webhook?: {
    enabled: boolean
    url: string
    headers?: Record<string, string>
  }
}

export interface TestExecution {
  id: string
  name: string
  status: TestStatus
  startTime: Date
  endTime?: Date
  config: TestConfig
  results?: TestResult[]
  progress: number
  currentTest?: string
  createdBy?: string
}

export interface TestResult {
  id: string
  testType: TestType
  browser: BrowserType
  environment: string
  status: 'passed' | 'failed' | 'skipped'
  startTime: Date
  endTime: Date
  duration: number
  error?: TestError
  screenshots?: string[]
  metrics?: Record<string, any>
  details?: any
}

export interface TestError {
  message: string
  stack?: string
  code?: string
  screenshot?: string
  context?: Record<string, any>
}

export interface UITestSuite {
  name: string
  tests: UITest[]
}

export interface UITest {
  name: string
  description: string
  steps: UITestStep[]
  assertions: UIAssertion[]
}

export interface UITestStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'hover'
  selector?: string
  value?: string
  timeout?: number
  options?: Record<string, any>
}

export interface UIAssertion {
  type: 'visible' | 'hidden' | 'text' | 'value' | 'count' | 'attribute'
  selector?: string
  expected: any
  message?: string
}

export interface PerformanceResult {
  url: string
  metrics: PerformanceMetrics
  lighthouse?: any
  coverage?: {
    js: number
    css: number
  }
}

export interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
  timeToInteractive?: number
  totalBlockingTime?: number
}

export interface AccessibilityResult {
  url: string
  violations: AccessibilityViolation[]
  passes: AccessibilityPass[]
  incomplete: AccessibilityIncomplete[]
  score: number
  level: 'A' | 'AA' | 'AAA'
}

export interface AccessibilityViolation {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  description: string
  help: string
  helpUrl: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityPass {
  id: string
  description: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityIncomplete {
  id: string
  description: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityNode {
  html: string
  target: string[]
  failureSummary?: string
}

export interface ResponsiveResult {
  breakpoint: Breakpoint
  viewport: ViewportSize
  screenshots: string[]
  issues: ResponsiveIssue[]
  layoutShift: number
}

export interface Breakpoint {
  name: string
  width: number
  height: number
  deviceType: 'desktop' | 'tablet' | 'mobile'
}

export interface ResponsiveIssue {
  type: 'overflow' | 'overlap' | 'invisible' | 'misaligned'
  element: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface Report {
  id: string
  executionId: string
  type: ReportType
  format: ReportFormat
  content: string
  filePath?: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface ReportTemplate {
  name: string
  path: string
  variables?: Record<string, any>
}

export interface PDFOptions {
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top: string
    right: string
    bottom: string
    left: string
  }
}

export interface ErrorRecoveryStrategy {
  retryCount: number
  retryDelay: number
  fallbackAction?: () => Promise<void>
  skipOnFailure: boolean
  notifyOnError: boolean
}

export interface TestStatusUpdate {
  executionId: string
  status: TestStatus
  progress: number
  currentTest: string
  results?: Partial<TestResult>
  timestamp: Date
}