#!/usr/bin/env node

/**
 * Chat4 多用户完整Web服务器
 * 同时托管前端页面和API服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = '127.0.0.1';

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

// 发送HTML响应
function sendHTML(response, html, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  response.end(html);
}

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

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
const apiRoutes = {
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

// 读取静态文件
function serveStaticFile(filePath, response) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在，返回404页面
        serveNotFound(response);
      } else {
        // 服务器错误
        serveServerError(response, err.message);
      }
    } else {
      // 成功响应
      const extname = path.extname(filePath);
      let contentType = mimeTypes[extname] || 'application/octet-stream';
      
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
}

// 404页面
function serveNotFound(response) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - 页面未找到</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 500px; margin: 0 auto; }
        h1 { color: #d32f2f; margin-bottom: 20px; }
        p { color: #666; margin: 15px 0; }
        a { color: #1976d2; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .home-btn { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        .home-btn:hover { background: #1565c0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404 - 页面未找到</h1>
        <p>抱歉，您访问的页面不存在。</p>
        <p><a href="/" class="home-btn">返回首页</a></p>
    </div>
</body>
</html>`;
  sendHTML(response, html, 404);
}

// 服务器错误页面
function serveServerError(response, message) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>500 - 服务器错误</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 500px; margin: 0 auto; }
        h1 { color: #d32f2f; margin-bottom: 20px; }
        p { color: #666; margin: 15px 0; }
        .error-details { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; text-align: left; }
        a { color: #1976d2; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .home-btn { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        .home-btn:hover { background: #1565c0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>500 - 服务器错误</h1>
        <p>抱歉，服务器内部错误。</p>
        <div class="error-details">错误信息: ${message}</div>
        <p><a href="/" class="home-btn">返回首页</a></p>
    </div>
</body>
</html>`;
  sendHTML(response, html, 500);
}

// 创建HTTP服务器
const server = http.createServer(async (request, response) => {
  // 解析URL
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname;

  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    sendJSON(response, {}, 200);
    return;
  }

  // 处理API路由
  if (pathname.startsWith('/api/')) {
    const handler = apiRoutes[pathname];
    if (handler) {
      await handler(request, response);
    } else {
      sendJSON(response, {
        success: false,
        error: { code: 'NOT_FOUND', message: 'API route not found' }
      }, 404);
    }
    return;
  }

  // 处理静态文件
  let filePath = pathname;
  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }

  // 构建完整的文件路径
  filePath = path.join(__dirname, filePath);

  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      serveNotFound(response);
    } else {
      serveStaticFile(filePath, response);
    }
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log(`🚀 Chat4 多用户完整服务器启动成功！`);
  console.log(`🌐 访问地址: http://${HOST}:${PORT}`);
  console.log(`🔍 健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`📱 测试页面: http://${HOST}:${PORT}/`);
  console.log(`🎯 现在你可以通过浏览器正常访问了！`);
  console.log(`\n💡 这是一个内存演示服务器，重启后数据会丢失`);
  console.log(`🔒 密码验证已简化，任何密码都可以登录`);
});

console.log('🔄 正在启动服务器...');