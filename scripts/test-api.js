#!/usr/bin/env node

const fs = require('fs');
require('dotenv').config();

async function testAPI() {
  console.log('🧪 测试API连接...\n');
  
  // 测试Z.ai API
  if (process.env.ZAI_API_KEY) {
    console.log('🔍 测试Z.ai API...');
    try {
      // 动态导入ZAI SDK
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      
      // 发送测试请求
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'user', content: '请回复"测试成功"' }
        ],
        max_tokens: 10
      });
      
      if (completion.choices && completion.choices[0] && completion.choices[0].message) {
        console.log('✅ Z.ai API连接成功');
        console.log(`   响应: ${completion.choices[0].message.content}`);
      } else {
        console.log('❌ Z.ai API响应格式异常');
      }
    } catch (error) {
      console.log('❌ Z.ai API测试失败:', error.message);
    }
  } else {
    console.log('⚠️  未设置Z.ai API密钥');
  }
  
  // 测试OpenAI API
  if (process.env.OPENAI_API_KEY) {
    console.log('\n🔍 测试OpenAI API...');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: '请回复"测试成功"' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI API连接成功');
        console.log(`   响应: ${data.choices[0]?.message?.content}`);
      } else {
        console.log('❌ OpenAI API连接失败:', response.status);
      }
    } catch (error) {
      console.log('❌ OpenAI API测试失败:', error.message);
    }
  } else {
    console.log('⚠️  未设置OpenAI API密钥');
  }
  
  // 测试Ollama API
  console.log('\n🔍 测试Ollama API...');
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama API连接成功');
      console.log(`   可用模型: ${data.models ? data.models.map(m => m.name).join(', ') : '无'}`);
      
      // 测试生成
      if (data.models && data.models.length > 0) {
        const testResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: data.models[0].name,
            prompt: '请回复"测试成功"',
            stream: false
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`   生成测试: ${testData.response ? '成功' : '失败'}`);
        }
      }
    } else {
      console.log('❌ Ollama API连接失败:', response.status);
    }
  } catch (error) {
    console.log('❌ Ollama API测试失败:', error.message);
    console.log('   请确保Ollama服务正在运行 (http://localhost:11434)');
  }
  
  console.log('\n📋 总结:');
  const configuredServices = [];
  if (process.env.ZAI_API_KEY) configuredServices.push('Z.ai');
  if (process.env.OPENAI_API_KEY) configuredServices.push('OpenAI');
  
  if (configuredServices.length > 0) {
    console.log('✅ 已配置服务:', configuredServices.join(', '));
    console.log('🚀 您可以启动项目并开始使用虚拟角色聊天室了');
    console.log('\n启动命令: npm run dev');
    console.log('访问地址: http://localhost:3000');
  } else {
    console.log('❌ 未配置任何API密钥');
    console.log('📝 请运行以下命令进行设置:');
    console.log('node setup.js');
  }
}

testAPI().catch(console.error);