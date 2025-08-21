#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试用户数据
const user1 = {
  email: 'test1@example.com',
  password: 'password123',
  name: 'Test User 1'
};

const user2 = {
  email: 'test2@example.com',
  password: 'password123',
  name: 'Test User 2'
};

let user1Token = '';
let user2Token = '';

// 简单的HTTP请求函数
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 开始多用户功能测试...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    try {
      const healthResponse = await request(`${BASE_URL}/api/health`);
      if (healthResponse.status === 200) {
        console.log('✅ 健康检查通过:', healthResponse.data.status);
      } else {
        console.log('❌ 健康检查失败:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ 无法连接到服务器，请确保服务器正在运行');
      console.log('   错误:', error.message);
      return;
    }

    // 2. 测试用户注册
    console.log('\n2. 测试用户注册...');
    
    // 注册用户1
    try {
      const register1Response = await request(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user1)
      });
      
      if (register1Response.status === 201) {
        console.log('✅ 用户1注册成功');
        user1Token = register1Response.data.data.token.accessToken;
        console.log('   用户ID:', register1Response.data.data.user.id);
      } else if (register1Response.status === 409) {
        console.log('ℹ️  用户1已存在，尝试登录...');
        // 如果用户已存在，尝试登录
        const login1Response = await request(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user1.email, password: user1.password })
        });
        
        if (login1Response.status === 200) {
          console.log('✅ 用户1登录成功');
          user1Token = login1Response.data.data.token.accessToken;
        }
      } else {
        console.log('❌ 用户1注册失败:', register1Response.status);
        console.log('   错误信息:', register1Response.data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ 用户1注册请求失败:', error.message);
    }

    // 注册用户2
    try {
      const register2Response = await request(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user2)
      });
      
      if (register2Response.status === 201) {
        console.log('✅ 用户2注册成功');
        user2Token = register2Response.data.data.token.accessToken;
        console.log('   用户ID:', register2Response.data.data.user.id);
      } else if (register2Response.status === 409) {
        console.log('ℹ️  用户2已存在，尝试登录...');
        // 如果用户已存在，尝试登录
        const login2Response = await request(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user2.email, password: user2.password })
        });
        
        if (login2Response.status === 200) {
          console.log('✅ 用户2登录成功');
          user2Token = login2Response.data.data.token.accessToken;
        }
      } else {
        console.log('❌ 用户2注册失败:', register2Response.status);
        console.log('   错误信息:', register2Response.data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ 用户2注册请求失败:', error.message);
    }

    // 3. 测试用户信息获取
    console.log('\n3. 测试用户信息获取...');
    
    if (user1Token) {
      try {
        const user1InfoResponse = await request(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (user1InfoResponse.status === 200) {
          console.log('✅ 用户1信息获取成功');
          console.log('   邮箱:', user1InfoResponse.data.data.user.email);
          console.log('   姓名:', user1InfoResponse.data.data.user.name);
        } else {
          console.log('❌ 用户1信息获取失败:', user1InfoResponse.status);
        }
      } catch (error) {
        console.log('❌ 用户1信息获取请求失败:', error.message);
      }
    }

    // 4. 测试聊天室创建
    console.log('\n4. 测试聊天室创建...');
    
    if (user1Token) {
      try {
        const room1Response = await request(`${BASE_URL}/api/chatrooms`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({ name: 'User1 Chat Room', theme: 'default' })
        });
        
        if (room1Response.status === 200) {
          console.log('✅ 用户1聊天室创建成功');
          console.log('   聊天室ID:', room1Response.data.data.chatRoom.id);
        } else {
          console.log('❌ 用户1聊天室创建失败:', room1Response.status);
          console.log('   错误信息:', room1Response.data.error?.message || 'Unknown error');
        }
      } catch (error) {
        console.log('❌ 用户1聊天室创建请求失败:', error.message);
      }
    }

    // 5. 测试权限控制
    console.log('\n5. 测试权限控制...');
    
    // 测试未授权访问
    try {
      const unauthorizedResponse = await request(`${BASE_URL}/api/auth/me`);
      if (unauthorizedResponse.status === 401) {
        console.log('✅ 未授权访问被正确拒绝');
      } else {
        console.log('❌ 未授权访问未被拒绝:', unauthorizedResponse.status);
      }
    } catch (error) {
      console.log('❌ 未授权访问测试失败:', error.message);
    }

    console.log('\n🎉 多用户功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('💡 请确保服务器正在运行在 http://localhost:3000');
  }
}

// 运行测试
testAPI();