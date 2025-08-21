import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('API Health Check @api', () => {
  test('should return a healthy status from /api/health', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });
});
