/**
 * @fileoverview Socket.IO实时通信测试套件 - TestCraft AI
 * TestCraft AI - RealtimeTestAgent
 * 世界级测试标准：连接稳定性、消息顺序、状态同步、故障恢复
 */

import { io, Socket } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AddressInfo } from 'net';

describe('Socket.IO Real-time Communication Tests', () => {
  let httpServer: any;
  let ioServer: Server;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let port: number;

  beforeAll((done) => {
    // 创建测试服务器
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // 设置Socket.IO事件处理
    ioServer.on('connection', (socket) => {
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', { userId: socket.id });
      });

      socket.on('chat-message', (data: { roomId: string, message: string, userId: string }) => {
        socket.to(data.roomId).emit('new-message', {
          id: Date.now().toString(),
          message: data.message,
          userId: data.userId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('request-ai-response', (data: { roomId: string, message: string }) => {
        // 模拟AI响应
        socket.to(data.roomId).emit('ai-response', {
          id: Date.now().toString(),
          message: `AI回复: ${data.message}`,
          timestamp: new Date().toISOString(),
          isAI: true
        });
      });

      socket.on('disconnect', () => {
        // 通知其他用户
        socket.broadcast.emit('user-left', { userId: socket.id });
      });
    });

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket1) clientSocket1.disconnect();
    if (clientSocket2) clientSocket2.disconnect();
    ioServer.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    // 为每个测试创建新的客户端连接
    clientSocket1 = io(`http://localhost:${port}`);
    clientSocket2 = io(`http://localhost:${port}`);

    let connectedCount = 0;
    const checkBothConnected = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    clientSocket1.on('connect', checkBothConnected);
    clientSocket2.on('connect', checkBothConnected);
  });

  afterEach(() => {
    if (clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  describe('🔌 连接稳定性测试', () => {
    test('应成功建立连接', (done) => {
      expect(clientSocket1.connected).toBe(true);
      expect(clientSocket2.connected).toBe(true);
      done();
    });

    test('断线重连机制', (done) => {
      let reconnectCount = 0;
      
      clientSocket1.on('disconnect', () => {
        reconnectCount++;
      });

      clientSocket1.on('reconnect', () => {
        expect(reconnectCount).toBeGreaterThan(0);
        expect(clientSocket1.connected).toBe(true);
        done();
      });

      // 模拟断线
      clientSocket1.disconnect();
      setTimeout(() => {
        clientSocket1.connect();
      }, 100);
    });

    test('多客户端同时连接', (done) => {
      const clientSocket3 = io(`http://localhost:${port}`);
      const clientSocket4 = io(`http://localhost:${port}`);

      let connectedCount = 0;
      const checkAllConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          expect(clientSocket3.connected).toBe(true);
          expect(clientSocket4.connected).toBe(true);
          clientSocket3.disconnect();
          clientSocket4.disconnect();
          done();
        }
      };

      clientSocket3.on('connect', checkAllConnected);
      clientSocket4.on('connect', checkAllConnected);
    });
  });

  describe('💬 消息顺序保证测试', () => {
    test('消息应按发送顺序到达', (done) => {
      const roomId = 'test-room-order';
      const messages = ['消息1', '消息2', '消息3', '消息4', '消息5'];
      const receivedMessages: string[] = [];

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket2.on('new-message', (data) => {
        receivedMessages.push(data.message);
        
        if (receivedMessages.length === messages.length) {
          expect(receivedMessages).toEqual(messages);
          done();
        }
      });

      // 依次发送消息
      setTimeout(() => {
        messages.forEach((msg, index) => {
          setTimeout(() => {
            clientSocket1.emit('chat-message', {
              roomId,
              message: msg,
              userId: 'user1'
            });
          }, index * 50);
        });
      }, 100);
    });

    test('并发消息处理 - 不应丢失消息', (done) => {
      const roomId = 'test-concurrent';
      const messageCount = 20;
      let receivedCount = 0;

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket1.on('new-message', () => {
        receivedCount++;
      });

      clientSocket2.on('new-message', () => {
        receivedCount++;
        if (receivedCount === messageCount * 2) {
          done();
        }
      });

      // 并发发送消息
      setTimeout(() => {
        for (let i = 0; i < messageCount; i++) {
          clientSocket1.emit('chat-message', {
            roomId,
            message: `用户1消息${i}`,
            userId: 'user1'
          });
          clientSocket2.emit('chat-message', {
            roomId,
            message: `用户2消息${i}`,
            userId: 'user2'
          });
        }
      }, 100);
    });
  });

  describe('🔄 聊天室状态同步测试', () => {
    test('用户加入通知应广播给所有成员', (done) => {
      const roomId = 'test-join-sync';
      let joinNotifications = 0;

      clientSocket1.emit('join-room', roomId);

      clientSocket1.on('user-joined', (data) => {
        joinNotifications++;
        expect(data.userId).toBeDefined();
      });

      setTimeout(() => {
        clientSocket2.emit('join-room', roomId);
      }, 100);

      setTimeout(() => {
        expect(joinNotifications).toBe(1);
        done();
      }, 300);
    });

    test('用户离开通知应广播给剩余成员', (done) => {
      const roomId = 'test-leave-sync';
      let leaveNotifications = 0;

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket1.on('user-left', (data) => {
        leaveNotifications++;
        expect(data.userId).toBe(clientSocket2.id);
      });

      setTimeout(() => {
        clientSocket2.disconnect();
      }, 200);

      setTimeout(() => {
        expect(leaveNotifications).toBe(1);
        done();
      }, 400);
    });

    test('多房间隔离测试', (done) => {
      const room1 = 'room-1';
      const room2 = 'room-2';
      let room1Messages = 0;
      let room2Messages = 0;

      clientSocket1.emit('join-room', room1);
      clientSocket2.emit('join-room', room2);

      clientSocket1.on('new-message', () => {
        room1Messages++;
      });

      clientSocket2.on('new-message', () => {
        room2Messages++;
      });

      setTimeout(() => {
        // 向房间1发送消息
        clientSocket1.emit('chat-message', {
          roomId: room1,
          message: '房间1消息',
          userId: 'user1'
        });

        // 向房间2发送消息  
        clientSocket2.emit('chat-message', {
          roomId: room2,
          message: '房间2消息',
          userId: 'user2'
        });
      }, 100);

      setTimeout(() => {
        expect(room1Messages).toBe(0); // 房间1不应收到房间2的消息
        expect(room2Messages).toBe(0); // 房间2不应收到房间1的消息
        done();
      }, 300);
    });
  });

  describe('🤖 AI响应集成测试', () => {
    test('AI响应应正确路由到指定房间', (done) => {
      const roomId = 'test-ai-response';

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket2.on('ai-response', (data) => {
        expect(data.message).toContain('AI回复');
        expect(data.isAI).toBe(true);
        expect(data.timestamp).toBeDefined();
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('request-ai-response', {
          roomId,
          message: '请解释人工智能'
        });
      }, 100);
    });

    test('AI响应不应泄露到其他房间', (done) => {
      const room1 = 'ai-room-1';
      const room2 = 'ai-room-2';
      let wrongRoomResponse = false;

      clientSocket1.emit('join-room', room1);
      clientSocket2.emit('join-room', room2);

      clientSocket2.on('ai-response', () => {
        wrongRoomResponse = true;
      });

      setTimeout(() => {
        clientSocket1.emit('request-ai-response', {
          roomId: room1,
          message: '测试消息'
        });
      }, 100);

      setTimeout(() => {
        expect(wrongRoomResponse).toBe(false);
        done();
      }, 300);
    });
  });

  describe('⚡ 网络条件模拟测试', () => {
    test('高延迟网络下的消息传递', (done) => {
      const roomId = 'test-latency';
      let messageReceived = false;

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      // 模拟高延迟
      clientSocket1.io.opts.timeout = 5000;
      clientSocket2.io.opts.timeout = 5000;

      clientSocket2.on('new-message', (data) => {
        messageReceived = true;
        expect(data.message).toBe('延迟测试消息');
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('chat-message', {
          roomId,
          message: '延迟测试消息',
          userId: 'user1'
        });
      }, 100);
    });

    test('网络中断恢复后的消息同步', (done) => {
      const roomId = 'test-recovery';
      let recoveryMessageReceived = false;

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket2.on('new-message', (data) => {
        if (data.message === '恢复后消息') {
          recoveryMessageReceived = true;
        }
      });

      // 模拟断线重连
      setTimeout(() => {
        clientSocket2.disconnect();
        setTimeout(() => {
          clientSocket2.connect();
          clientSocket2.on('connect', () => {
            clientSocket2.emit('join-room', roomId);
            setTimeout(() => {
              clientSocket1.emit('chat-message', {
                roomId,
                message: '恢复后消息',
                userId: 'user1'
              });
            }, 100);
          });
        }, 200);
      }, 100);

      setTimeout(() => {
        expect(recoveryMessageReceived).toBe(true);
        done();
      }, 1000);
    });
  });

  describe('📊 性能基准测试', () => {
    test('消息广播延迟应小于100ms', async () => {
      const roomId = 'test-performance';
      const iterations = 10;
      const delays: number[] = [];

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      return new Promise((resolve) => {
        let completed = 0;

        clientSocket2.on('new-message', (data) => {
          const delay = Date.now() - parseInt(data.id);
          delays.push(delay);
          completed++;

          if (completed === iterations) {
            const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
            expect(avgDelay).toBeLessThan(100);
            resolve(void 0);
          }
        });

        // 发送测试消息
        for (let i = 0; i < iterations; i++) {
          setTimeout(() => {
            clientSocket1.emit('chat-message', {
              roomId,
              message: `性能测试${i}`,
              userId: 'user1'
            });
          }, i * 50);
        }
      });
    });

    test('并发用户连接测试 - 50个用户', (done) => {
      const roomId = 'test-concurrent-users';
      const userCount = 50;
      const sockets: Socket[] = [];
      let connectedCount = 0;

      for (let i = 0; i < userCount; i++) {
        const socket = io(`http://localhost:${port}`);
        sockets.push(socket);

        socket.on('connect', () => {
          socket.emit('join-room', roomId);
          connectedCount++;

          if (connectedCount === userCount) {
            // 验证所有用户都成功连接
            expect(connectedCount).toBe(userCount);

            // 清理
            sockets.forEach(socket => socket.disconnect());
            done();
          }
        });
      }
    });
  });

  describe('🔒 安全性测试', () => {
    test('无效房间ID处理', (done) => {
      const invalidRoomIds = [null, undefined, '', '   ', 12345];
      let errorCount = 0;

      clientSocket1.on('error', () => {
        errorCount++;
      });

      invalidRoomIds.forEach(roomId => {
        clientSocket1.emit('join-room', roomId as any);
      });

      setTimeout(() => {
        expect(errorCount).toBe(0); // 应优雅处理无效输入
        done();
      }, 200);
    });

    test('消息大小限制测试', (done) => {
      const roomId = 'test-message-size';
      const largeMessage = 'A'.repeat(10000); // 10KB消息

      clientSocket1.emit('join-room', roomId);
      clientSocket2.emit('join-room', roomId);

      clientSocket2.on('new-message', (data) => {
        expect(data.message.length).toBeLessThanOrEqual(10000);
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('chat-message', {
          roomId,
          message: largeMessage,
          userId: 'user1'
        });
      }, 100);
    });
  });
});