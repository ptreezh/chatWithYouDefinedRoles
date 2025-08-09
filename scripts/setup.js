#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎭 虚拟角色聊天室设置向导\n');

// 检查.env文件是否存在
const envPath = '.env';
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ 找到现有的.env文件\n');
} else {
  console.log('❌ 未找到.env文件，将创建新文件\n');
  envContent = 'DATABASE_URL=file:/home/z/my-project/db/custom.db\n';
}

// 提示用户输入API密钥
function setupAPIKeys() {
  console.log('请设置API密钥（至少需要一个有效的API密钥）：\n');
  
  rl.question('1. 输入您的Z.ai API密钥（推荐，留空跳过）: ', (zaiKey) => {
    rl.question('2. 输入您的OpenAI API密钥（可选，留空跳过）: ', (openaiKey) => {
      
      // 更新环境变量内容
      if (zaiKey.trim()) {
        const zaiRegex = /ZAI_API_KEY=.*/;
        if (zaiRegex.test(envContent)) {
          envContent = envContent.replace(zaiRegex, `ZAI_API_KEY=${zaiKey.trim()}`);
        } else {
          envContent += `ZAI_API_KEY=${zaiKey.trim()}\n`;
        }
        console.log('✅ Z.ai API密钥已设置');
      }
      
      if (openaiKey.trim()) {
        const openaiRegex = /OPENAI_API_KEY=.*/;
        if (openaiRegex.test(envContent)) {
          envContent = envContent.replace(openaiRegex, `OPENAI_API_KEY=${openaiKey.trim()}`);
        } else {
          envContent += `OPENAI_API_KEY=${openaiKey.trim()}\n`;
        }
        console.log('✅ OpenAI API密钥已设置');
      }
      
      if (!zaiKey.trim() && !openaiKey.trim()) {
        console.log('⚠️  警告：未设置任何API密钥，AI功能将无法正常工作');
      }
      
      // 保存.env文件
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ 环境变量已保存到.env文件\n');
      
      // 显示角色文件信息
      showCharacterFiles();
    });
  });
}

function showCharacterFiles() {
  console.log('📁 可用的角色文件示例：\n');
  
  const characterFiles = [
    '科技专家.txt',
    '心理咨询师.json', 
    '创业导师.md',
    '小智角色定义.txt',
    '小张角色定义.txt',
    '小李角色定义.txt',
    '王总角色定义.json'
  ];
  
  characterFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} (不存在)`);
    }
  });
  
  console.log('\n📋 使用说明：');
  console.log('1. 启动项目: npm run dev');
  console.log('2. 访问: http://localhost:3000');
  console.log('3. 上传角色文件开始聊天');
  console.log('4. 详细说明请查看: 项目设置指南.md\n');
  
  rl.close();
}

// 开始设置
setupAPIKeys();