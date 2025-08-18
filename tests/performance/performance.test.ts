import { test, expect, chromium } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 测量页面加载时间
    const startTime = Date.now()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    console.log(`Page load time: ${loadTime}ms`)

    // 验证加载时间是否在可接受范围内（例如，小于5秒）
    expect(loadTime).toBeLessThan(5000)

    await page.close()
    await browser.close()
  })

  test('should have acceptable first contentful paint', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto('http://localhost:3000')

    // 等待页面完全加载
    await page.waitForLoadState('networkidle')

    // 获取性能指标
    const performanceMetrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint')
      const fcp = paint.find((p: any) => p.name === 'first-contentful-paint')
      return {
        firstContentfulPaint: fcp ? fcp.startTime : null
      }
    })

    console.log(`First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`)

    // 验证FCP是否在可接受范围内（例如，小于2秒）
    if (performanceMetrics.firstContentfulPaint !== null) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000)
    }

    await page.close()
    await browser.close()
  })

  test('should not have excessive layout shifts', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 启用布局偏移监控
    const client = await page.context().newCDPSession(page)
    await client.send('Performance.enable')

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 获取布局偏移信息
    const performanceMetrics = await client.send('Performance.getMetrics')
    const clsMetric = performanceMetrics.metrics.find(
      (m: any) => m.name === 'CumulativeLayoutShift'
    )

    console.log(`Cumulative Layout Shift: ${clsMetric ? clsMetric.value : 'N/A'}`)

    // 验证CLS是否在可接受范围内（小于0.1）
    if (clsMetric) {
      expect(clsMetric.value).toBeLessThan(0.1)
    }

    await client.detach()
    await page.close()
    await browser.close()
  })
})