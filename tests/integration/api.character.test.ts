import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Character API Endpoints @api', () => {
  let newCharacterId: string;

  test('should create a new character', async ({ request }) => {
    const newCharacter = {
      name: 'Test Character',
      description: 'A character for testing purposes',
      category: 'custom',
      model: 'test_model',
      // Add other required fields here
    };

    const response = await request.post(`${BASE_URL}/api/characters`, {
      data: newCharacter,
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id');
    newCharacterId = body.id;
    expect(body).toHaveProperty('name', 'Test Character');
  });

  test('should retrieve a list of characters', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/characters`);
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    // Check if the newly created character is in the list
    if (newCharacterId) {
      const found = body.some((char: any) => char.id === newCharacterId);
      expect(found).toBe(true);
    }
  });

  test('should retrieve a specific character', async ({ request }) => {
    expect(newCharacterId, 'Test depends on character creation').toBeDefined();
    const response = await request.get(`${BASE_URL}/api/characters/${newCharacterId}`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id', newCharacterId);
    expect(body).toHaveProperty('name', 'Test Character');
  });

  test('should delete a character', async ({ request }) => {
    expect(newCharacterId, 'Test depends on character creation').toBeDefined();
    const response = await request.delete(`${BASE_URL}/api/characters/${newCharacterId}`);
    
    expect(response.status()).toBe(204); // No content on successful deletion

    // Verify the character is actually deleted
    const getResponse = await request.get(`${BASE_URL}/api/characters/${newCharacterId}`);
    expect(getResponse.status()).toBe(404);
  });
});
