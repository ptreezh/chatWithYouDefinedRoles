import { test, expect } from '@playwright/test';

// Generate a random user email for each test run to ensure isolation
const randomEmail = `testuser_${Date.now()}@example.com`;
const password = 'password123';

test.describe('Authentication and Core Functionality', () => {

  test('should allow a user to register, log in, and upload a character', async ({ page }) => {
    // 1. Navigate to the app and verify redirection to auth page
    await page.goto('/');
    // Instead of checking URL, wait for a unique element on the auth page to be visible
    await expect(page.locator('[data-testid=login-submit-button]')).toBeVisible();
    // As an extra check, now we can assert the URL
    await expect(page).toHaveURL('/auth');

    // 2. Register a new user
    await page.click('[data-testid=register-tab]');
    await page.fill('[data-testid=register-email-input]', randomEmail);
    await page.fill('[data-testid=register-password-input]', password);
    await page.click('[data-testid=register-submit-button]');

    // Wait for the success toast to appear and disappear
    await expect(page.locator('text=Registration Successful')).toBeVisible();
    await expect(page.locator('text=Registration Successful')).not.toBeVisible({ timeout: 10000 });

    // 3. Log in with the new user
    await page.fill('[data-testid=login-email-input]', randomEmail);
    await page.fill('[data-testid=login-password-input]', password);
    await page.click('[data-testid=login-submit-button]');

    // 4. Verify successful login and redirection
    await expect(page).toHaveURL('/');
    
    // Check that the auth token exists in localStorage
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(authToken).toBeTruthy();

    // 5. Upload a character
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid=character-upload-button]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/e2e/test-character.txt');

    // 6. Verify the character was uploaded successfully
    // Check for the success message
    await expect(page.locator('text=成功上传 1 个角色！')).toBeVisible();

    // Check if the character appears in the list
    await expect(page.locator('text=test-character')).toBeVisible();
  });

});
