/**
 * 多用户认证系统测试套件
 * TestCraft AI - 验证多用户认证功能的正确性
 * 遵循TDD原则：红-绿-重构
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('Multi-User Authentication System @auth @multiuser', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  const user1 = {
    email: faker.internet.email(),
    password: faker.internet.password(12),
    name: faker.person.fullName()
  };

  const user2 = {
    email: faker.internet.email(),
    password: faker.internet.password(12),
    name: faker.person.fullName()
  };

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: user1
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user.email).toBe(user1.email);
      expect(body.data.user.name).toBe(user1.name);
      expect(body.data.user.status).toBe('PENDING');
      expect(body.data.user.role).toBe('USER');
      expect(body.data.token).toHaveProperty('accessToken');
      expect(body.data.token).toHaveProperty('refreshToken');
      
      user1Id = body.data.user.id;
      user1Token = body.data.token.accessToken;
    });

    test('should prevent duplicate email registration', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: user1
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('EMAIL_EXISTS');
    });

    test('should validate required fields for registration', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: { email: user2.email } // 缺少密码
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate email format', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: { email: 'invalid-email', password: 'password123' }
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ request }) => {
      // 先注册第二个用户
      await request.post(`${BASE_URL}/api/auth/register`, {
        data: user2
      });

      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: user2.email, password: user2.password }
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(user2.email);
      expect(body.data.token).toHaveProperty('accessToken');
      expect(body.data.token).toHaveProperty('refreshToken');
      
      user2Id = body.data.user.id;
      user2Token = body.data.token.accessToken;
    });

    test('should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: user1.email, password: 'wrong-password' }
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject non-existent user login', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: 'nonexistent@example.com', password: 'password123' }
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  test.describe('User Profile Management', () => {
    test.beforeEach(async ({ request }) => {
      // 确保用户已登录
      if (!user1Token) {
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { email: user1.email, password: user1.password }
        });
        const loginBody = await loginResponse.json();
        user1Token = loginBody.data.token.accessToken;
      }
    });

    test('should get current user profile', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.id).toBe(user1Id);
      expect(body.data.user.email).toBe(user1.email);
    });

    test('should reject unauthorized profile access', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/me`);

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    test('should update user profile', async ({ request }) => {
      const updateData = { name: 'Updated Name' };
      const response = await request.put(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: updateData
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.name).toBe('Updated Name');
    });

    test('should delete user account', async ({ request }) => {
      // 创建一个临时用户来测试删除
      const tempUser = {
        email: faker.internet.email(),
        password: faker.internet.password(12),
        name: faker.person.fullName()
      };

      // 注册临时用户
      const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
        data: tempUser
      });
      const registerBody = await registerResponse.json();
      const tempToken = registerBody.data.token.accessToken;

      // 删除用户
      const deleteResponse = await request.delete(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      expect(deleteResponse.status()).toBe(200);
      const deleteBody = await deleteResponse.json();
      expect(deleteBody.success).toBe(true);

      // 验证用户无法再登录
      const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: tempUser.email, password: tempUser.password }
      });
      expect(loginResponse.status()).toBe(401);
    });
  });

  test.describe('Data Isolation Between Users', () => {
    let user1CharacterId: string;
    let user2CharacterId: string;
    let user1ChatRoomId: string;
    let user2ChatRoomId: string;

    test.beforeEach(async ({ request }) => {
      // 确保两个用户都已登录
      if (!user1Token) {
        const login1Response = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { email: user1.email, password: user1.password }
        });
        user1Token = login1Response.data.token.accessToken;
      }
      
      if (!user2Token) {
        const login2Response = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { email: user2.email, password: user2.password }
        });
        user2Token = login2Response.data.token.accessToken;
      }
    });

    test('should isolate character data between users', async ({ request }) => {
      // 用户1创建角色
      const user1Character = {
        name: 'User1 Character',
        systemPrompt: 'You are a character for user 1'
      };

      const formData = new FormData();
      formData.append('file', new Blob(['user1 character content'], { type: 'text/plain' }), 'user1-char.txt');
      formData.append('theme', 'default');

      const user1CharResponse = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: formData
      });

      expect(user1CharResponse.status()).toBe(200);
      const user1CharBody = await user1CharResponse.json();
      expect(user1CharBody.success).toBe(true);
      user1CharacterId = user1CharBody.data.successful[0].character.id;

      // 用户2创建角色
      const user2Character = {
        name: 'User2 Character',
        systemPrompt: 'You are a character for user 2'
      };

      const formData2 = new FormData();
      formData2.append('file', new Blob(['user2 character content'], { type: 'text/plain' }), 'user2-char.txt');
      formData2.append('theme', 'default');

      const user2CharResponse = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: formData2
      });

      expect(user2CharResponse.status()).toBe(200);
      const user2CharBody = await user2CharResponse.json();
      expect(user2CharBody.success).toBe(true);
      user2CharacterId = user2CharBody.data.successful[0].character.id;

      // 验证用户1只能看到自己的角色
      const user1CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1CharsBody = await user1CharsResponse.json();
      expect(user1CharsBody.success).toBe(true);
      expect(user1CharsBody.data.characters.every((char: any) => 
        char.id === user1CharacterId
      )).toBe(true);

      // 验证用户2只能看到自己的角色
      const user2CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2CharsBody = await user2CharsResponse.json();
      expect(user2CharsBody.success).toBe(true);
      expect(user2CharsBody.data.characters.every((char: any) => 
        char.id === user2CharacterId
      )).toBe(true);
    });

    test('should isolate chat room data between users', async ({ request }) => {
      // 用户1创建聊天室
      const user1ChatRoom = {
        name: 'User1 Chat Room',
        theme: 'default'
      };

      const user1RoomResponse = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: user1ChatRoom
      });

      expect(user1RoomResponse.status()).toBe(200);
      const user1RoomBody = await user1RoomResponse.json();
      expect(user1RoomBody.success).toBe(true);
      user1ChatRoomId = user1RoomBody.data.chatRoom.id;

      // 用户2创建聊天室
      const user2ChatRoom = {
        name: 'User2 Chat Room',
        theme: 'default'
      };

      const user2RoomResponse = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: user2ChatRoom
      });

      expect(user2RoomResponse.status()).toBe(200);
      const user2RoomBody = await user2RoomResponse.json();
      expect(user2RoomBody.success).toBe(true);
      user2ChatRoomId = user2RoomBody.data.chatRoom.id;

      // 验证用户1只能看到自己的聊天室
      const user1RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1RoomsBody = await user1RoomsResponse.json();
      expect(user1RoomsBody.success).toBe(true);
      expect(user1RoomsBody.data.chatRooms.every((room: any) => 
        room.id === user1ChatRoomId
      )).toBe(true);

      // 验证用户2只能看到自己的聊天室
      const user2RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2RoomsBody = await user2RoomsResponse.json();
      expect(user2RoomsBody.success).toBe(true);
      expect(user2RoomsBody.data.chatRooms.every((room: any) => 
        room.id === user2ChatRoomId
      )).toBe(true);
    });

    test('should prevent cross-user data access', async ({ request }) => {
      // 用户1尝试访问用户2的聊天室
      const crossAccessResponse = await request.post(`${BASE_URL}/api/chat/respond`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: {
          message: 'Hello',
          chatRoomId: user2ChatRoomId,
          characterId: user1CharacterId
        }
      });

      expect(crossAccessResponse.status()).toBe(404);
      const crossAccessBody = await crossAccessResponse.json();
      expect(crossAccessBody.success).toBe(false);
      expect(crossAccessBody.error.code).toBe('CHATROOM_NOT_FOUND');

      // 用户2尝试访问用户1的角色
      const crossCharResponse = await request.get(`${BASE_URL}/api/characters/${user1CharacterId}`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      expect(crossCharResponse.status()).toBe(404);
    });
  });

  test.describe('Token Security', () => {
    test('should reject expired tokens', async ({ request }) => {
      // 这里需要模拟过期token，实际测试可能需要调整JWT过期时间
      const expiredToken = 'expired.token.here';
      
      const response = await request.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject malformed tokens', async ({ request }) => {
      const malformedToken = 'malformed.token';
      
      const response = await request.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${malformedToken}` }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject requests without authorization header', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/me`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Performance and Scalability', () => {
    test('should handle concurrent user registrations', async ({ request }) => {
      const concurrentUsers = Array(5).fill(null).map(() => ({
        email: faker.internet.email(),
        password: faker.internet.password(12),
        name: faker.person.fullName()
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        concurrentUsers.map(user => 
          request.post(`${BASE_URL}/api/auth/register`, { data: user })
        )
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
      expect(responses.every(response => response.status() === 201)).toBe(true);
    });

    test('should handle concurrent authenticated requests', async ({ request }) => {
      const requests = Array(10).fill(null).map(() => 
        request.get(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${user1Token}` }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2秒内完成
      expect(responses.every(response => response.status() === 200)).toBe(true);
    });
  });
});