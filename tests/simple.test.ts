import { test, expect } from '@playwright/test';

test('should be able to access a website', async ({ page }) => {
  // 使用一个公共网站来测试
  await page.goto('https://example.com');
  
  // 验证页面标题
  await expect(page).toHaveTitle('Example Domain');
  
  // 验证页面包含特定文本
  await expect(page.getByText('This domain is for use in illustrative examples')).toBeVisible();
  
  // 验证页面包含链接
  await expect(page.getByRole('link')).toBeVisible();
});