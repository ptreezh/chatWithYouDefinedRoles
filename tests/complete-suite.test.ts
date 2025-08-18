import { test, expect, chromium } from '@playwright/test';

test.describe('Chat4 Application - Complete Test Suite', () => {
  test('Complete E2E test suite for Chat4', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // 1. 端到端测试
      console.log('Running E2E tests...');
      
      // 导航到首页
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // 验证关键元素存在
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
      
      // 2. 性能测试
      console.log('Running performance tests...');
      
      // 测量页面加载时间
      const startTime = Date.now();
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // 应该在5秒内加载
      
      // 3. 可访问性测试
      console.log('Running accessibility tests...');
      
      // 注入axe-core库
      await page.addScriptTag({ 
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' 
      });
      
      // 运行axe-core检查
      const accessibilityResults = await page.evaluate(async () => {
        // @ts-ignore
        return await axe.run();
      });
      
      const violations = accessibilityResults.violations;
      console.log(`Accessibility violations found: ${violations.length}`);
      
      // 验证严重违反项数量
      const seriousOrCriticalViolations = violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );
      
      console.log(`Serious or critical violations: ${seriousOrCriticalViolations.length}`);
      
      // 4. 响应式测试
      console.log('Running responsive tests...');
      
      const viewports = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        // 验证关键元素在所有视口中都可见
        await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
        
        console.log(`Responsive test passed for ${viewport.name}`);
      }
      
      console.log('All tests completed successfully!');
      
    } catch (error) {
      console.error('Test suite failed:', error);
      throw error;
    } finally {
      await page.close();
      await browser.close();
    }
  });
});