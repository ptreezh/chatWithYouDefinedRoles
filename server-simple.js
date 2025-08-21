#!/usr/bin/env node

/**
 * 简化版Chat4多用户服务器
 * 用于演示多用户功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 导入简化数据库
const { initDatabase, user, character, chatroom } = require('./src/lib/db-simple.js');

const PORT = 3000;
const JWT_SECRET = 'your-secret-key';
const REFRESH_TOKEN_SECRET = 'your-refresh-secret';

// 存储活跃用户会话
const activeUsers = new Map();

// 认证中间件
async function authenticate(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return await user.findById(payload.sub);
  } catch (error) {
    return null;
  }
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

// 解析表单数据
function parseFormData(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => body += chunk.toString());
    request.on('end', () => {
      try {
        // 简化处理，实际应该解析multipart/form-data
        resolve(body);
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

// 生成JWT令牌
function generateTokens(user) {
  const accessToken = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时过期
  }, JWT_SECRET);

  const refreshToken = jwt.sign({
    sub: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
  }, REFRESH_TOKEN_SECRET);

  return { accessToken, refreshToken };
}

// 路由处理器
const routes = {
  // 健康检查
  '/api/health': async (request, response) => {
    sendJSON(response, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'development'
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
      const existingUser = await user.findByEmail(email);
      if (existingUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email address is already in use' }
        }, 409);
      }

      // 加密密码
      const password_hash = await bcrypt.hash(password, 10);

      // 创建用户
      const newUser = await user.create({
        email,
        name: name || '',
        password_hash,
        status: 'PENDING',
        role: 'USER',
        email_verified: false
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
      const existingUser = await user.findByEmail(email);
      if (!existingUser || !existingUser.password_hash) {
        return sendJSON(response, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        }, 401);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, existingUser.password_hash);
      if (!isPasswordValid) {
        return sendJSON(response, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        }, 401);
      }

      // 更新最后登录时间
      await user.update(existingUser.id, { last_login_at: new Date().toISOString() });

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
      const authUser = await authenticate(request);
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
            avatar: authUser.avatar,
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
      const authUser = await authenticate(request);
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
              avatar: authUser.avatar,
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

        const updatedUser = await user.update(authUser.id, { name, avatar });
        
        sendJSON(response, {
          success: true,
          message: 'User profile updated successfully',
          data: { user: updatedUser }
        });
      } else if (request.method === 'DELETE') {
        await user.delete(authUser.id);
        
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
      const authUser = await authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        }, 401);
      }

      if (request.method === 'GET') {
        const chatRooms = await chatroom.findByUserId(authUser.id);
        
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

        const newChatRoom = await chatroom.create({
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
      const authUser = await authenticate(request);
      if (!authUser) {
        return sendJSON(response, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        }, 401);
      }

      if (request.method === 'GET') {
        const characters = await character.findByUserId(authUser.id);
        
        sendJSON(response, {
          success: true,
          data: { characters }
        });
      } else if (request.method === 'POST') {
        // 简化处理，实际应该解析multipart/form-data
        const body = await parseBody(request);
        
        // 创建模拟角色数据
        const newCharacter = await character.create({
          name: 'Demo Character',
          systemPrompt: 'You are a helpful assistant.',
          userId: authUser.id,
          category: 'custom',
          theme: 'default'
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
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Chat4 多用户服务器启动成功！`);
      console.log(`🌐 服务器地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📝 测试页面: file://${__dirname}/test-multiuser.html`);
      console.log(`\n🎯 多用户功能演示:`);
      console.log(`   1. 打开浏览器访问测试页面`);
      console.log(`   2. 注册两个不同的用户`);
      console.log(`   3. 分别登录两个用户`);
      console.log(`   4. 创建聊天室和角色`);
      console.log(`   5. 验证数据隔离功能`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();