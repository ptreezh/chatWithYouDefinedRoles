const http = require('http');

// 测试聊天功能是否调用真实LLM
function testChatLLM() {
  console.log('=== 测试聊天LLM调用 ===\n');
  
  // 模拟发送聊天消息 - 使用真实的角色ID和chatRoomId
  const chatData = JSON.stringify({
    message: '你好，请介绍一下人工智能的发展趋势',
    chatRoomId: 'cmdopxycd0000xj7eyvgvt9hq',  // 使用真实的chatRoomId
    characterId: 'cmdpel80f0001x6u9xggiqaa6'  // 使用真实的角色ID
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat/respond',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(chatData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`聊天响应状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('聊天响应:', response);
        
        if (response.response) {
          console.log('\n=== LLM调用分析 ===');
          console.log('回复长度:', response.response.length);
          console.log('回复内容预览:', response.response.substring(0, 100) + '...');
          
          // 简单判断是否为模拟回复
          const isDemoResponse = response.response.includes('演示模式') || 
                               response.response.includes('模拟回复') ||
                               response.response.includes('科技专家') ||
                               response.response.includes('心理咨询师');
          
          if (isDemoResponse) {
            console.log('❌ 检测到模拟回复，系统可能仍在使用演示模式');
          } else {
            console.log('✅ 检测到真实LLM回复');
          }
        }
        
      } catch (error) {
        console.log('响应解析失败:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('聊天请求失败:', error.message);
  });

  req.write(chatData);
  req.end();
}

// 等待一下再开始测试
setTimeout(() => {
  testChatLLM();
}, 1000);

console.log('将在1秒后测试聊天LLM调用...');