import { test, expect, chromium } from '@playwright/test'

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name}`, async () => {
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()

      // 设置视口尺寸
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      })

      // 导航到首页
      await page.goto('http://localhost:3000')
      await page.waitForLoadState('networkidle')

      // 检查关键元素是否可见
      const chatInputVisible = await page.isVisible('[data-testid="message-input"]')
      const sendButtonVisible = await page.isVisible('[data-testid="send-button"]')
      
      expect(chatInputVisible).toBeTruthy()
      expect(sendButtonVisible).toBeTruthy()

      // 检查布局是否适应屏幕尺寸
      const bodyWidth = await page.evaluate(() => document.body.clientWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width)

      // 在移动端，检查是否有滚动条（应该尽量避免水平滚动）
      if (viewport.name === 'mobile') {
        const hasHorizontalScrollbar = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })
        // 允许少量的水平滚动
        expect(hasHorizontalScrollbar).toBeFalsy()
      }

      await page.close()
      await browser.close()
    })
  }

  test('should adapt layout when resizing', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 初始为桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 获取初始状态
    const desktopElements = await page.locator('[data-testid="chat-history"]').count()

    // 调整为移动尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000) // 等待布局调整

    // 验证元素仍然存在
    const mobileElements = await page.locator('[data-testid="chat-history"]').count()
    expect(mobileElements).toBe(desktopElements)

    await page.close()
    await browser.close()
  })

  test('should maintain readable text sizes across devices', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    for (const viewport of viewports) {
      // 设置视口尺寸
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      })

      // 导航到首页
      await page.goto('http://localhost:3000')
      await page.waitForLoadState('networkidle')

      // 检查主要文本元素的字体大小
      const fontSize = await page.evaluate(() => {
        const element = document.querySelector('[data-testid="message-input"]')
        return element ? window.getComputedStyle(element).fontSize : null
      })

      // 验证字体大小是否合理（不小于12px）
      if (fontSize) {
        const sizeInPx = parseInt(fontSize, 10)
        expect(sizeInPx).toBeGreaterThanOrEqual(12)
      }

      // 清除页面以便下一次循环
      await page.goto('about:blank')
    }

    await page.close()
    await browser.close()
  })
})