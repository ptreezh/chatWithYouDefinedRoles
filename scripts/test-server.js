#!/usr/bin/env node

const http = require('http');

console.log('🔍 测试Chat4服务器连接...\n');

// 测试健康检查
function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/health', (res) => {
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
    
    req.on('error', (error) => {
      resolve({ status: 'ERROR', data: { message: error.message } });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', data: { message: 'Request timeout' } });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('1. 测试健康检查...');
  const healthResult = await testHealth();
  
  if (healthResult.status === 200) {
    console.log('✅ 健康检查通过');
    console.log('   状态:', healthResult.data.status);
    console.log('   环境:', healthResult.data.environment);
    console.log('   运行时间:', healthResult.data.uptime, '秒');
  } else {
    console.log('❌ 健康检查失败');
    console.log('   状态码:', healthResult.status);
    console.log('   错误:', healthResult.data.message || 'Unknown error');
    console.log('\n💡 请确保服务器正在运行在 http://localhost:3000');
    console.log('   启动命令: npm run dev');
    return;
  }

  console.log('\n2. 测试多用户功能...\n');
  
  // 测试用户注册
  console.log('📝 测试用户注册...');
  const testData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const registerReq = http.request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 201) {
          console.log('✅ 用户注册测试通过');
          console.log('   用户ID:', parsed.data.user.id);
          console.log('   邮箱:', parsed.data.user.email);
          
          // 测试用户信息获取
          console.log('\n👤 测试用户信息获取...');
          const token = parsed.data.token.accessToken;
          
          const meReq = http.request('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          }, (meRes) => {
            let meData = '';
            meRes.on('data', chunk => meData += chunk);
            meRes.on('end', () => {
              try {
                const meParsed = JSON.parse(meData);
                if (meRes.statusCode === 200) {
                  console.log('✅ 用户信息获取测试通过');
                  console.log('   用户邮箱:', meParsed.data.user.email);
                  console.log('   用户姓名:', meParsed.data.user.name);
                } else {
                  console.log('❌ 用户信息获取测试失败:', meRes.statusCode);
                }
              } catch (e) {
                console.log('❌ 用户信息获取解析失败:', e.message);
              }
              
              console.log('\n🎉 基本功能测试完成！');
              console.log('\n📋 完整测试请使用浏览器访问:');
              console.log('   file:///' + __dirname + '/test-multiuser.html');
            });
          });
          
          meReq.on('error', (error) => {
            console.log('❌ 用户信息获取请求失败:', error.message);
          });
          
          meReq.end();
          
        } else if (res.statusCode === 409) {
          console.log('ℹ️ 用户已存在，测试登录功能...');
          // 测试登录
          const loginReq = http.request('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, (loginRes) => {
            let loginData = '';
            loginRes.on('data', chunk => loginData += chunk);
            loginRes.on('end', () => {
              try {
                const loginParsed = JSON.parse(loginData);
                if (loginRes.statusCode === 200) {
                  console.log('✅ 用户登录测试通过');
                  console.log('   用户邮箱:', loginParsed.data.user.email);
                } else {
                  console.log('❌ 用户登录测试失败:', loginRes.statusCode);
                }
              } catch (e) {
                console.log('❌ 登录响应解析失败:', e.message);
              }
              
              console.log('\n🎉 基本功能测试完成！');
              console.log('\n📋 完整测试请使用浏览器访问:');
              console.log('   file:///' + __dirname + '/test-multiuser.html');
            });
          });
          
          loginReq.on('error', (error) => {
            console.log('❌ 登录请求失败:', error.message);
          });
          
          loginReq.write(JSON.stringify({
            email: testData.email,
            password: testData.password
          }));
          loginReq.end();
          
        } else {
          console.log('❌ 用户注册测试失败:', res.statusCode);
          console.log('   错误:', parsed.error?.message || 'Unknown error');
        }
      } catch (e) {
        console.log('❌ 注册响应解析失败:', e.message);
        console.log('   原始数据:', data);
      }
    });
  });
  
  registerReq.on('error', (error) => {
    console.log('❌ 注册请求失败:', error.message);
  });
  
  registerReq.write(JSON.stringify(testData));
  registerReq.end();
}

runTests();