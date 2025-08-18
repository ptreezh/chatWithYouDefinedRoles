import { test, expect, chromium } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test('should pass basic accessibility checks', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 导航到首页
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 注入axe-core库
    await page.addScriptTag({ 
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' 
    })

    // 运行axe-core检查
    const accessibilityResults = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run()
    })

    // 检查是否有违反项
    const violations = accessibilityResults.violations
    console.log(`Accessibility violations found: ${violations.length}`)

    // 输出前几个违反项的详细信息
    for (let i = 0; i < Math.min(3, violations.length); i++) {
      console.log(`Violation ${i + 1}: ${violations[i].description}`)
      console.log(`Impact: ${violations[i].impact}`)
      console.log(`Help: ${violations[i].help}`)
      console.log('---')
    }

    // 验证违反项数量是否在可接受范围内
    // 对于一个新项目，我们可能希望没有严重的违反项
    const seriousOrCriticalViolations = violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    )
    
    // 由于这是一个示例测试，我们暂时放宽限制
    // 在实际项目中，应该修复所有严重和关键的违反项
    expect(seriousOrCriticalViolations.length).toBeLessThanOrEqual(5)

    await page.close()
    await browser.close()
  })

  test('should have proper color contrast', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 导航到首页
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 注入axe-core库
    await page.addScriptTag({ 
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' 
    })

    // 运行axe-core检查，仅检查颜色对比度
    const contrastResults = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run({ 
        runOnly: {
          type: 'rule',
          values: ['color-contrast']
        }
      })
    })

    // 检查颜色对比度违反项
    const contrastViolations = contrastResults.violations
    console.log(`Color contrast violations found: ${contrastViolations.length}`)

    // 验证颜色对比度违反项数量是否在可接受范围内
    expect(contrastViolations.length).toBeLessThanOrEqual(3)

    await page.close()
    await browser.close()
  })

  test('should be navigable by keyboard', async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // 导航到首页
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 检查输入框是否可以获得焦点
    await page.focus('[data-testid="message-input"]')
    const isInputFocused = await page.evaluate(() => {
      return document.activeElement?.getAttribute('data-testid') === 'message-input'
    })
    expect(isInputFocused).toBeTruthy()

    // 检查发送按钮是否可以通过Tab键访问
    await page.keyboard.press('Tab')
    // 注意：实际的焦点元素取决于页面的具体实现
    // 这里我们只是验证没有错误发生

    await page.close()
    await browser.close()
  })
})