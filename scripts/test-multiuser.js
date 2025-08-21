#!/usr/bin/env node

/**
 * 多用户功能测试脚本
 * 使用node-fetch进行API测试
 */

const fetch = require('node-fetch');

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

async function testAPI() {
  console.log('🚀 开始多用户功能测试...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ 健康检查通过:', healthData.status);
      } else {
        console.log('❌ 健康检查失败:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ 无法连接到服务器，请确保服务器正在运行');
      return;
    }

    // 2. 测试用户注册
    console.log('\n2. 测试用户注册...');
    
    // 注册用户1
    try {
      const register1Response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user1)
      });
      
      if (register1Response.status === 201) {
        const register1Data = await register1Response.json();
        console.log('✅ 用户1注册成功');
        user1Token = register1Data.data.token.accessToken;
        console.log('   用户ID:', register1Data.data.user.id);
      } else if (register1Response.status === 409) {
        console.log('ℹ️  用户1已存在，尝试登录...');
        // 如果用户已存在，尝试登录
        const login1Response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user1.email, password: user1.password })
        });
        
        if (login1Response.status === 200) {
          const login1Data = await login1Response.json();
          console.log('✅ 用户1登录成功');
          user1Token = login1Data.data.token.accessToken;
        }
      } else {
        const errorData = await register1Response.json();
        console.log('❌ 用户1注册失败:', errorData.error?.message || register1Response.status);
      }
    } catch (error) {
      console.log('❌ 用户1注册请求失败:', error.message);
    }

    // 注册用户2
    try {
      const register2Response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user2)
      });
      
      if (register2Response.status === 201) {
        const register2Data = await register2Response.json();
        console.log('✅ 用户2注册成功');
        user2Token = register2Data.data.token.accessToken;
        console.log('   用户ID:', register2Data.data.user.id);
      } else if (register2Response.status === 409) {
        console.log('ℹ️  用户2已存在，尝试登录...');
        // 如果用户已存在，尝试登录
        const login2Response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user2.email, password: user2.password })
        });
        
        if (login2Response.status === 200) {
          const login2Data = await login2Response.json();
          console.log('✅ 用户2登录成功');
          user2Token = login2Data.data.token.accessToken;
        }
      } else {
        const errorData = await register2Response.json();
        console.log('❌ 用户2注册失败:', errorData.error?.message || register2Response.status);
      }
    } catch (error) {
      console.log('❌ 用户2注册请求失败:', error.message);
    }

    // 3. 测试用户信息获取
    console.log('\n3. 测试用户信息获取...');
    
    if (user1Token) {
      try {
        const user1InfoResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (user1InfoResponse.status === 200) {
          const user1Info = await user1InfoResponse.json();
          console.log('✅ 用户1信息获取成功');
          console.log('   邮箱:', user1Info.data.user.email);
          console.log('   姓名:', user1Info.data.user.name);
        } else {
          console.log('❌ 用户1信息获取失败:', user1InfoResponse.status);
        }
      } catch (error) {
        console.log('❌ 用户1信息获取请求失败:', error.message);
      }
    }

    if (user2Token) {
      try {
        const user2InfoResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${user2Token}` }
        });
        
        if (user2InfoResponse.status === 200) {
          const user2Info = await user2InfoResponse.json();
          console.log('✅ 用户2信息获取成功');
          console.log('   邮箱:', user2Info.data.user.email);
          console.log('   姓名:', user2Info.data.user.name);
        } else {
          console.log('❌ 用户2信息获取失败:', user2InfoResponse.status);
        }
      } catch (error) {
        console.log('❌ 用户2信息获取请求失败:', error.message);
      }
    }

    // 4. 测试聊天室创建
    console.log('\n4. 测试聊天室创建...');
    
    if (user1Token) {
      try {
        const room1Response = await fetch(`${BASE_URL}/api/chatrooms`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({ name: 'User1 Chat Room', theme: 'default' })
        });
        
        if (room1Response.status === 200) {
          const room1Data = await room1Response.json();
          console.log('✅ 用户1聊天室创建成功');
          console.log('   聊天室ID:', room1Data.data.chatRoom.id);
        } else {
          const errorData = await room1Response.json();
          console.log('❌ 用户1聊天室创建失败:', errorData.error?.message || room1Response.status);
        }
      } catch (error) {
        console.log('❌ 用户1聊天室创建请求失败:', error.message);
      }
    }

    if (user2Token) {
      try {
        const room2Response = await fetch(`${BASE_URL}/api/chatrooms`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user2Token}`
          },
          body: JSON.stringify({ name: 'User2 Chat Room', theme: 'default' })
        });
        
        if (room2Response.status === 200) {
          const room2Data = await room2Response.json();
          console.log('✅ 用户2聊天室创建成功');
          console.log('   聊天室ID:', room2Data.data.chatRoom.id);
        } else {
          const errorData = await room2Response.json();
          console.log('❌ 用户2聊天室创建失败:', errorData.error?.message || room2Response.status);
        }
      } catch (error) {
        console.log('❌ 用户2聊天室创建请求失败:', error.message);
      }
    }

    // 5. 测试数据隔离
    console.log('\n5. 测试数据隔离...');
    
    if (user1Token && user2Token) {
      // 获取用户1的聊天室
      try {
        const user1RoomsResponse = await fetch(`${BASE_URL}/api/chatrooms`, {
          headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (user1RoomsResponse.status === 200) {
          const user1Rooms = await user1RoomsResponse.json();
          console.log('✅ 用户1聊天室列表获取成功');
          console.log('   聊天室数量:', user1Rooms.data.chatRooms.length);
        } else {
          console.log('❌ 用户1聊天室列表获取失败:', user1RoomsResponse.status);
        }
      } catch (error) {
        console.log('❌ 用户1聊天室列表获取请求失败:', error.message);
      }

      // 获取用户2的聊天室
      try {
        const user2RoomsResponse = await fetch(`${BASE_URL}/api/chatrooms`, {
          headers: { 'Authorization': `Bearer ${user2Token}` }
        });
        
        if (user2RoomsResponse.status === 200) {
          const user2Rooms = await user2RoomsResponse.json();
          console.log('✅ 用户2聊天室列表获取成功');
          console.log('   聊天室数量:', user2Rooms.data.chatRooms.length);
        } else {
          console.log('❌ 用户2聊天室列表获取失败:', user2RoomsResponse.status);
        }
      } catch (error) {
        console.log('❌ 用户2聊天室列表获取请求失败:', error.message);
      }
    }

    // 6. 测试权限控制
    console.log('\n6. 测试权限控制...');
    
    // 测试未授权访问
    try {
      const unauthorizedResponse = await fetch(`${BASE_URL}/api/auth/me`);
      if (unauthorizedResponse.status === 401) {
        console.log('✅ 未授权访问被正确拒绝');
      } else {
        console.log('❌ 未授权访问未被拒绝:', unauthorizedResponse.status);
      }
    } catch (error) {
      console.log('❌ 未授权访问测试失败:', error.message);
    }

    // 测试无效token
    try {
      const invalidTokenResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      if (invalidTokenResponse.status === 401) {
        console.log('✅ 无效token被正确拒绝');
      } else {
        console.log('❌ 无效token未被拒绝:', invalidTokenResponse.status);
      }
    } catch (error) {
      console.log('❌ 无效token测试失败:', error.message);
    }

    console.log('\n🎉 多用户功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('💡 请确保服务器正在运行在 http://localhost:3000');
  }
}

// 运行测试
testAPI();