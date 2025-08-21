#!/usr/bin/env node

/**
 * 内存版Chat4多用户演示服务器
 * 用于演示多用户功能，无需外部依赖
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const JWT_SECRET = 'demo-secret-key';

// 内存数据库
const memoryDB = {
  users: new Map(),
  characters: new Map(),
  chatrooms: new Map(),
  messages: new Map()
};

// 生成ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 模拟JWT（简化版）
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from('demo-signature').toString('base64');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // 简单的过期检查
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

// 认证中间件
function authenticate(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token);
  if (!payload) {
    return null;
  }

  return memoryDB.users.get(payload.sub);
}

// 解析请求体
function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => body += chunk.toString());
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 发送JSON响应
function sendJSON(response, data, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  response.end(JSON.stringify(data));
}

// 生成令牌
function generateTokens(user) {
  const accessToken = createJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时过期
  });

  const refreshToken = createJWT({
    sub: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
  });

  return { accessToken, refreshToken };
}

// 用户操作
const userOps = {
  create(userData) {
    const user = {
      id: generateId('user'),
      email: userData.email,
      name: userData.name || '',
      status: userData.status || 'PENDING',
      role: userData.role || 'USER',
      email_verified: userData.email_verified || false,
      password_hash: userData.password_hash || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memoryDB.users.set(user.id, user);
    return user;
  },

  findByEmail(email) {
    for (const user of memoryDB.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  findById(id) {
    return memoryDB.users.get(id);
  },

  update(id, updates) {
    const user = memoryDB.users.get(id);
    if (!user) return null;
    
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    return user;
  },

  delete(id) {
    return memoryDB.users.delete(id);
  }
};

// 角色操作
const characterOps = {
  create(characterData) {
    const character = {
      id: generateId('char'),
      name: characterData.name,
      systemPrompt: characterData.systemPrompt,
      avatar: characterData.avatar,
      category: characterData.category || 'custom',
      theme: characterData.theme,
      userId: characterData.userId,
      isActive: characterData.isActive !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memoryDB.characters.set(character.id, character);
    return character;
  },

  findByUserId(userId) {
    const result = [];
    for (const character of memoryDB.characters.values()) {
      if (character.userId === userId && character.isActive) {
        result.push(character);
      }
    }
    return result;
  },

  findByIdAndUserId(id, userId) {
    const character = memoryDB.characters.get(id);
    if (character && character.userId === userId && character.isActive) {
      return character;
    }
    return null;
  }
};

// 聊天室操作
const chatroomOps = {
  create(roomData) {
    const room = {
      id: generateId('room'),
      name: roomData.name,
      theme: roomData.theme,
      userId: roomData.userId,
      isActive: roomData.isActive !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memoryDB.chatrooms.set(room.id, room);
    return room;
  },

  findByUserId(userId) {
    const result = [];
    for (const room of memoryDB.chatrooms.values()) {
      if (room.userId === userId && room.isActive) {
        result.push(room);
      }
    }
    // 按创建时间倒序排列
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findByIdAndUserId(id, userId) {
    const room = memoryDB.chatrooms.get(id);
    if (room && room.userId === userId && room.isActive) {
      return room;
    }
    return null;
  }
};

// 路由处理器
const routes = {
  // 健康检查
  '/api/health': async (request, response) => {
    sendJSON(response, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'development',
      users: memoryDB.users.size,
      chatrooms: memoryDB.chatrooms.size,
      characters: memoryDB.characters.size
    });
  },

  // 用户注册
  '/api/auth/register': async (request, response) => {
    try {
      const body = await parseBody(request);
      const { email, password, name } = body;

      if (!email || !password) {
        return sendJSON(response, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
        }, 400);
      }

      // 检查邮箱是否已存在
      const existingUser = userOps.findByEmail(email);
      if (existingUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email address is already in use' }
        }, 409);
      }

      // 创建用户（内存中不加密密码）
      const newUser = userOps.create({
        email,
        name: name || '',
        status: 'PENDING',
        role: 'USER',
        email_verified: false,
        password_hash: 'demo-hash'
      });

      // 生成令牌
      const tokens = generateTokens(newUser);

      sendJSON(response, {
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            status: newUser.status,
            role: newUser.role,
            created_at: newUser.created_at
          },
          token: tokens
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  },

  // 用户登录
  '/api/auth/login': async (request, response) => {
    try {
      const body = await parseBody(request);
      const { email, password } = body;

      if (!email || !password) {
        return sendJSON(response, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
        }, 400);
      }

      // 查找用户
      const existingUser = userOps.findByEmail(email);
      if (!existingUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        }, 401);
      }

      // 内存版本直接接受任何密码
      // 更新最后登录时间
      userOps.update(existingUser.id, { last_login_at: new Date().toISOString() });

      // 生成令牌
      const tokens = generateTokens(existingUser);

      sendJSON(response, {
        success: true,
        data: {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            status: existingUser.status,
            role: existingUser.role,
            last_login_at: existingUser.last_login_at,
            created_at: existingUser.created_at
          },
          token: tokens
        },
        message: 'Login successful'
      });

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  },

  // 获取用户信息
  '/api/auth/me': async (request, response) => {
    try {
      const authUser = authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
        }, 401);
      }

      sendJSON(response, {
        success: true,
        data: {
          user: {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            status: authUser.status,
            role: authUser.role,
            email_verified: authUser.email_verified,
            last_login_at: authUser.last_login_at,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at
          }
        }
      });

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  },

  // 用户管理
  '/api/users/me': async (request, response) => {
    try {
      const authUser = authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        }, 401);
      }

      if (request.method === 'GET') {
        sendJSON(response, {
          success: true,
          data: {
            user: {
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              status: authUser.status,
              role: authUser.role,
              email_verified: authUser.email_verified,
              last_login_at: authUser.last_login_at,
              created_at: authUser.created_at,
              updated_at: authUser.updated_at
            }
          }
        });
      } else if (request.method === 'PUT') {
        const body = await parseBody(request);
        const { name, avatar } = body;

        const updatedUser = userOps.update(authUser.id, { name, avatar });
        
        sendJSON(response, {
          success: true,
          message: 'User profile updated successfully',
          data: { user: updatedUser }
        });
      } else if (request.method === 'DELETE') {
        // 删除用户及其相关数据
        userOps.delete(authUser.id);
        
        // 删除用户的角色
        for (const character of memoryDB.characters.values()) {
          if (character.userId === authUser.id) {
            memoryDB.characters.delete(character.id);
          }
        }
        
        // 删除用户的聊天室
        for (const room of memoryDB.chatrooms.values()) {
          if (room.userId === authUser.id) {
            memoryDB.chatrooms.delete(room.id);
          }
        }
        
        sendJSON(response, {
          success: true,
          message: 'User account deleted successfully'
        });
      }

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  },

  // 聊天室管理
  '/api/chatrooms': async (request, response) => {
    try {
      const authUser = authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        }, 401);
      }

      if (request.method === 'GET') {
        const chatRooms = chatroomOps.findByUserId(authUser.id);
        
        sendJSON(response, {
          success: true,
          data: { chatRooms }
        });
      } else if (request.method === 'POST') {
        const body = await parseBody(request);
        const { name, theme } = body;

        if (!name || name.trim() === '') {
          return sendJSON(response, {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Chat room name is required' }
          }, 400);
        }

        const newChatRoom = chatroomOps.create({
          name: name.trim(),
          theme: theme || null,
          userId: authUser.id
        });

        sendJSON(response, {
          success: true,
          message: 'Chat room created successfully',
          data: { chatRoom: newChatRoom }
        });
      }

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  },

  // 角色管理
  '/api/characters': async (request, response) => {
    try {
      const authUser = authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        }, 401);
      }

      if (request.method === 'GET') {
        const characters = characterOps.findByUserId(authUser.id);
        
        sendJSON(response, {
          success: true,
          data: { characters }
        });
      } else if (request.method === 'POST') {
        const body = await parseBody(request);
        const { name, systemPrompt, theme } = body;

        if (!name || !systemPrompt) {
          return sendJSON(response, {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Character name and system prompt are required' }
          }, 400);
        }

        const newCharacter = characterOps.create({
          name: name.trim(),
          systemPrompt: systemPrompt.trim(),
          theme: theme || 'default',
          userId: authUser.id,
          category: 'custom'
        });

        sendJSON(response, {
          success: true,
          message: 'Character created successfully',
          data: { character: newCharacter }
        });
      }

    } catch (error) {
      sendJSON(response, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      }, 500);
    }
  }
};

// 创建服务器
const server = http.createServer(async (request, response) => {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    sendJSON(response, {}, 200);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  // 查找路由
  const handler = routes[pathname];
  if (handler) {
    await handler(request, response);
  } else {
    sendJSON(response, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' }
    }, 404);
  }
});

// 启动服务器
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Chat4 多用户演示服务器启动成功！`);
  console.log(`🌐 服务器地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📝 测试页面: file://${__dirname}/test-multiuser.html`);
  console.log(`\n🎯 多用户功能演示:`);
  console.log(`   1. 打开浏览器访问测试页面`);
  console.log(`   2. 注册两个不同的用户 (例如: user1@example.com, user2@example.com)`);
  console.log(`   3. 分别登录两个用户`);
  console.log(`   4. 创建聊天室和角色`);
  console.log(`   5. 验证数据隔离功能`);
  console.log(`\n💡 这是一个内存演示服务器，重启后数据会丢失`);
  console.log(`🔒 密码验证已简化，任何密码都可以登录`);
});

console.log('🔄 正在启动服务器...');