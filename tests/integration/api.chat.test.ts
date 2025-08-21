import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Chat API Endpoint @api', () => {
  // This test will require a character to be available.
  // For now, we'll assume a character exists or mock it.
  // A more robust solution would be to create a character in a setup step.
  const CHARACTER_ID = 'some-existing-character-id'; // Replace with a valid ID for testing

  test('should get a response from the chat API', async ({ request }) => {
    const message = {
      characterId: CHARACTER_ID,
      message: 'Hello, world!',
      // sessionId is needed to maintain conversation context
      sessionId: `test-session-${Date.now()}`, 
    };

    const response = await request.post(`${BASE_URL}/api/chat/respond`, {
      data: message,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    
    // The response should contain the AI's message
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });
});
