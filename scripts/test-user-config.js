const http = require('http');

// 模拟用户在界面上配置API密钥
function testUserApiConfig() {
  console.log('=== 模拟用户API配置测试 ===\n');
  
  // 1. 首先检查当前配置状态
  console.log('1. 检查当前API配置状态...');
  
  const checkOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/config',
    method: 'GET'
  };

  const checkReq = http.request(checkOptions, (res) => {
    console.log(`   状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('   当前配置:', response);
        
        // 2. 模拟用户设置真实API密钥
        console.log('\n2. 模拟用户设置真实API密钥...');
        setRealApiKey();
        
      } catch (error) {
        console.log('   响应解析失败:', data);
      }
    });
  });

  checkReq.on('error', (error) => {
    console.error('   检查配置失败:', error.message);
  });

  checkReq.end();
}

// 设置真实的API密钥
function setRealApiKey() {
  const postData = JSON.stringify({
    zaiApiKey: 'sk-user-real-zai-key-123456',  // 模拟用户设置的真实密钥
    openaiApiKey: 'sk-user-real-openai-key-789012'  // 模拟用户设置的真实密钥
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/config',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('   设置结果:', response);
        
        // 3. 验证配置是否生效
        console.log('\n3. 验证配置是否生效...');
        setTimeout(verifyConfig, 1000);
        
      } catch (error) {
        console.log('   响应解析失败:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('   设置配置失败:', error.message);
  });

  req.write(postData);
  req.end();
}

// 验证配置是否生效
function verifyConfig() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/config',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`   状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('   验证结果:', response);
        
        // 4. 检查配置文件
        console.log('\n4. 检查配置文件...');
        checkConfigFile();
        
      } catch (error) {
        console.log('   响应解析失败:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('   验证配置失败:', error.message);
  });

  req.end();
}

// 检查配置文件
function checkConfigFile() {
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(process.cwd(), '.api-config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      console.log('   配置文件内容:', {
        zaiApiKey: config.zaiApiKey ? '已设置' : '未设置',
        openaiApiKey: config.openaiApiKey ? '已设置' : '未设置',
        isDemo: config.zaiApiKey === 'demo-key-for-testing',
        zaiConfigured: config.zaiApiKey && config.zaiApiKey !== 'demo-key-for-testing',
        openaiConfigured: config.openaiApiKey && config.openaiApiKey !== 'demo-openai-key-for-testing'
      });
      
      console.log('\n=== 测试总结 ===');
      if (config.zaiApiKey !== 'demo-key-for-testing' && config.zaiApiKey !== 'sk-test-real-key-for-user') {
        console.log('✅ 用户API配置成功！系统应该使用真实LLM响应。');
      } else {
        console.log('❌ 用户API配置可能失败，系统仍使用测试密钥。');
      }
      
    } else {
      console.log('   ❌ 配置文件不存在');
    }
  } catch (error) {
    console.error('   读取配置文件失败:', error.message);
  }
}

// 等待服务器启动后开始测试
setTimeout(() => {
  testUserApiConfig();
}, 2000);

console.log('将在2秒后开始模拟用户API配置测试...');