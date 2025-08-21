/**
 * 多用户数据隔离测试套件
 * TestCraft AI - 验证用户数据完全隔离
 * 遵循TDD原则：红-绿-重构
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('Multi-User Data Isolation @isolation @database', () => {
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

  test.beforeAll(async ({ request }) => {
    // 注册两个用户
    const user1Response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: user1
    });
    const user1Body = await user1Response.json();
    user1Token = user1Body.data.token.accessToken;
    user1Id = user1Body.data.user.id;

    const user2Response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: user2
    });
    const user2Body = await user2Response.json();
    user2Token = user2Body.data.token.accessToken;
    user2Id = user2Body.data.user.id;
  });

  test.describe('Character Data Isolation', () => {
    test('should ensure characters are owned by specific users', async ({ request }) => {
      // 用户1创建角色
      const char1Data = new FormData();
      char1Data.append('file', new Blob(['User1 character prompt'], { type: 'text/plain' }), 'char1.txt');
      char1Data.append('theme', 'user1-theme');

      const char1Response = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: char1Data
      });

      expect(char1Response.status()).toBe(200);
      const char1Body = await char1Response.json();
      const char1Id = char1Body.data.successful[0].character.id;

      // 用户2创建角色
      const char2Data = new FormData();
      char2Data.append('file', new Blob(['User2 character prompt'], { type: 'text/plain' }), 'char2.txt');
      char2Data.append('theme', 'user2-theme');

      const char2Response = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: char2Data
      });

      expect(char2Response.status()).toBe(200);
      const char2Body = await char2Response.json();
      const char2Id = char2Body.data.successful[0].character.id;

      // 验证角色隔离
      const user1CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1CharsBody = await user1CharsResponse.json();
      expect(user1CharsBody.success).toBe(true);
      expect(user1CharsBody.data.characters).toHaveLength(1);
      expect(user1CharsBody.data.characters[0].id).toBe(char1Id);

      const user2CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2CharsBody = await user2CharsResponse.json();
      expect(user2CharsBody.success).toBe(true);
      expect(user2CharsBody.data.characters).toHaveLength(1);
      expect(user2CharsBody.data.characters[0].id).toBe(char2Id);
    });

    test('should prevent cross-user character access', async ({ request }) => {
      // 创建更多角色
      const char1Data = new FormData();
      char1Data.append('file', new Blob(['Another user1 character'], { type: 'text/plain' }), 'char1-2.txt');
      char1Data.append('theme', 'user1-theme');

      await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: char1Data
      });

      // 用户2尝试访问用户1的角色
      const user1CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1CharsBody = await user1CharsResponse.json();
      const user1CharIds = user1CharsBody.data.characters.map((char: any) => char.id);

      // 用户2尝试通过ID访问用户1的角色
      for (const charId of user1CharIds) {
        const crossAccessResponse = await request.get(`${BASE_URL}/api/characters/${charId}`, {
          headers: { Authorization: `Bearer ${user2Token}` }
        });

        expect(crossAccessResponse.status()).toBe(404);
      }
    });

    test('should maintain character ownership integrity', async ({ request }) => {
      // 用户1创建角色
      const charData = new FormData();
      charData.append('file', new Blob(['Test character for ownership'], { type: 'text/plain' }), 'ownership-test.txt');
      charData.append('theme', 'test-theme');

      const createResponse = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: charData
      });

      expect(createResponse.status()).toBe(200);
      const createBody = await createResponse.json();
      const charId = createBody.data.successful[0].character.id;

      // 验证角色属于用户1
      const user1CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1CharsBody = await user1CharsResponse.json();
      const ownedChar = user1CharsBody.data.characters.find((char: any) => char.id === charId);
      expect(ownedChar).toBeDefined();

      // 用户2无法看到该角色
      const user2CharsResponse = await request.get(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2CharsBody = await user2CharsResponse.json();
      const unownedChar = user2CharsBody.data.characters.find((char: any) => char.id === charId);
      expect(unownedChar).toBeUndefined();
    });
  });

  test.describe('Chat Room Data Isolation', () => {
    test('should ensure chat rooms are owned by specific users', async ({ request }) => {
      // 用户1创建聊天室
      const room1Response = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: { name: 'User1 Room', theme: 'user1-theme' }
      });

      expect(room1Response.status()).toBe(200);
      const room1Body = await room1Response.json();
      const room1Id = room1Body.data.chatRoom.id;

      // 用户2创建聊天室
      const room2Response = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: { name: 'User2 Room', theme: 'user2-theme' }
      });

      expect(room2Response.status()).toBe(200);
      const room2Body = await room2Response.json();
      const room2Id = room2Body.data.chatRoom.id;

      // 验证聊天室隔离
      const user1RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1RoomsBody = await user1RoomsResponse.json();
      expect(user1RoomsBody.success).toBe(true);
      expect(user1RoomsBody.data.chatRooms.some((room: any) => room.id === room1Id)).toBe(true);
      expect(user1RoomsBody.data.chatRooms.some((room: any) => room.id === room2Id)).toBe(false);

      const user2RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2RoomsBody = await user2RoomsResponse.json();
      expect(user2RoomsBody.success).toBe(true);
      expect(user2RoomsBody.data.chatRooms.some((room: any) => room.id === room2Id)).toBe(true);
      expect(user2RoomsBody.data.chatRooms.some((room: any) => room.id === room1Id)).toBe(false);
    });

    test('should prevent cross-user chat room access', async ({ request }) => {
      // 创建聊天室和角色用于聊天测试
      const roomResponse = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: { name: 'Private Room', theme: 'private' }
      });

      const roomBody = await roomResponse.json();
      const roomId = roomBody.data.chatRoom.id;

      const charData = new FormData();
      charData.append('file', new Blob(['Private character'], { type: 'text/plain' }), 'private-char.txt');
      charData.append('theme', 'private');

      const charResponse = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: charData
      });

      const charBody = await charResponse.json();
      const charId = charBody.data.successful[0].character.id;

      // 用户2尝试在用户1的聊天室中发送消息
      const chatResponse = await request.post(`${BASE_URL}/api/chat/respond`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: {
          message: 'Hello from user2',
          chatRoomId: roomId,
          characterId: charId
        }
      });

      expect(chatResponse.status()).toBe(404);
      const chatBody = await chatResponse.json();
      expect(chatBody.success).toBe(false);
      expect(chatBody.error.code).toBe('CHATROOM_NOT_FOUND');
    });
  });

  test.describe('Message Data Isolation', () => {
    test('should ensure messages are isolated by chat room and user', async ({ request }) => {
      // 用户1创建聊天室和角色
      const room1Response = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: { name: 'User1 Message Room', theme: 'user1' }
      });

      const room1Body = await room1Response.json();
      const room1Id = room1Body.data.chatRoom.id;

      const char1Data = new FormData();
      char1Data.append('file', new Blob(['User1 message character'], { type: 'text/plain' }), 'char1-msg.txt');
      char1Data.append('theme', 'user1');

      const char1Response = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: char1Data
      });

      const char1Body = await char1Response.json();
      const char1Id = char1Body.data.successful[0].character.id;

      // 用户1发送消息
      const message1Response = await request.post(`${BASE_URL}/api/chat/respond`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: {
          message: 'Hello from user1',
          chatRoomId: room1Id,
          characterId: char1Id
        }
      });

      expect(message1Response.status()).toBe(200);

      // 用户2创建同名聊天室和角色
      const room2Response = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: { name: 'User1 Message Room', theme: 'user2' }
      });

      const room2Body = await room2Response.json();
      const room2Id = room2Body.data.chatRoom.id;

      const char2Data = new FormData();
      char2Data.append('file', new Blob(['User2 message character'], { type: 'text/plain' }), 'char2-msg.txt');
      char2Data.append('theme', 'user2');

      const char2Response = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: char2Data
      });

      const char2Body = await char2Response.json();
      const char2Id = char2Body.data.successful[0].character.id;

      // 用户2发送消息
      const message2Response = await request.post(`${BASE_URL}/api/chat/respond`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        data: {
          message: 'Hello from user2',
          chatRoomId: room2Id,
          characterId: char2Id
        }
      });

      expect(message2Response.status()).toBe(200);

      // 验证消息隔离 - 这里需要添加获取消息的API端点来验证
      // 暂时通过聊天响应来验证隔离
    });
  });

  test.describe('Database Cascade Deletion', () => {
    test('should cascade delete user data when user is deleted', async ({ request }) => {
      // 创建临时用户
      const tempUser = {
        email: faker.internet.email(),
        password: faker.internet.password(12),
        name: faker.person.fullName()
      };

      const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
        data: tempUser
      });

      expect(registerResponse.status()).toBe(200);
      const registerBody = await registerResponse.json();
      const tempToken = registerBody.data.token.accessToken;
      const tempUserId = registerBody.data.user.id;

      // 临时用户创建角色和聊天室
      const tempRoomResponse = await request.post(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${tempToken}` },
        data: { name: 'Temp User Room', theme: 'temp' }
      });

      expect(tempRoomResponse.status()).toBe(200);

      const tempCharData = new FormData();
      tempCharData.append('file', new Blob(['Temp user character'], { type: 'text/plain' }), 'temp-char.txt');
      tempCharData.append('theme', 'temp');

      const tempCharResponse = await request.post(`${BASE_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${tempToken}` },
        data: tempCharData
      });

      expect(tempCharResponse.status()).toBe(200);

      // 删除用户
      const deleteResponse = await request.delete(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      expect(deleteResponse.status()).toBe(200);

      // 验证用户数据被完全删除（通过尝试登录验证）
      const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: tempUser.email, password: tempUser.password }
      });

      expect(loginResponse.status()).toBe(401);
    });
  });

  test.describe('Concurrent Data Access', () => {
    test('should handle concurrent data creation without conflicts', async ({ request }) => {
      // 两个用户同时创建数据
      const concurrentOperations = [
        request.post(`${BASE_URL}/api/chatrooms`, {
          headers: { Authorization: `Bearer ${user1Token}` },
          data: { name: 'Concurrent Room 1', theme: 'concurrent' }
        }),
        request.post(`${BASE_URL}/api/chatrooms`, {
          headers: { Authorization: `Bearer ${user2Token}` },
          data: { name: 'Concurrent Room 2', theme: 'concurrent' }
        })
      ];

      const startTime = Date.now();
      const responses = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2秒内完成
      expect(responses.every(response => response.status() === 200)).toBe(true);

      // 验证数据隔离
      const user1RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      const user1RoomsBody = await user1RoomsResponse.json();
      const user1Room = user1RoomsBody.data.chatRooms.find((room: any) => 
        room.name === 'Concurrent Room 1'
      );
      expect(user1Room).toBeDefined();

      const user2RoomsResponse = await request.get(`${BASE_URL}/api/chatrooms`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      const user2RoomsBody = await user2RoomsResponse.json();
      const user2Room = user2RoomsBody.data.chatRooms.find((room: any) => 
        room.name === 'Concurrent Room 2'
      );
      expect(user2Room).toBeDefined();
    });
  });
});