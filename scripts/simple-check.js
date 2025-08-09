// 简单的环境检查
console.log('🔍 Chat4 项目环境检查\n');

// 检查核心文件
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'package.json',
    'server.ts',
    'src/app/page.tsx',
    'src/lib/chat-service.ts',
    'prisma/schema.prisma'
];

console.log('📁 检查核心文件:');
let allFilesExist = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 缺失`);
        allFilesExist = false;
    }
}

// 检查目录结构
const requiredDirs = [
    'src/components',
    'src/app/api',
    'characters/categories',
    'scripts',
    'docs'
];

console.log('\n📁 检查目录结构:');
for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - 缺失`);
        allFilesExist = false;
    }
}

// 检查测试脚本
const testScripts = [
    'scripts/e2e-test.js',
    'scripts/performance-test.js',
    'scripts/test-runner.js',
    'scripts/basic-test.js'
];

console.log('\n🧪 检查测试脚本:');
for (const script of testScripts) {
    const scriptPath = path.join(__dirname, '..', script);
    if (fs.existsSync(scriptPath)) {
        console.log(`✅ ${script}`);
    } else {
        console.log(`❌ ${script} - 缺失`);
        allFilesExist = false;
    }
}

// 检查配置文件
const configFiles = [
    'test-config.json',
    '.env',
    'tsconfig.json',
    'tailwind.config.ts'
];

console.log('\n⚙️ 检查配置文件:');
for (const file of configFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} - 可选（缺失但可用）`);
    }
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
    console.log('🎉 项目文件结构完整！');
    console.log('\n🚀 下一步操作:');
    console.log('1. 确保已安装 Node.js (v18+) 和 npm');
    console.log('2. 安装依赖: npm install');
    console.log('3. 启动 Ollama: ollama serve');
    console.log('4. 启动开发服务器: npm run dev');
    console.log('5. 运行测试: npm run test:basic');
    
    console.log('\n📝 预期结果:');
    console.log('- 开发服务器在 http://localhost:3000 启动');
    console.log('- 可以访问聊天界面');
    console.log('- 能够上传角色文件');
    console.log('- 支持主题管理');
    console.log('- 可以调用本地Ollama模型');
    
} else {
    console.log('❌ 项目文件结构不完整，请检查上述缺失的文件');
}

console.log('\n🤖 Ollama 模型要求:');
console.log('- 确保已安装 Ollama: https://ollama.ai/');
console.log('- 推荐模型: llama2, mistral, codellama');
console.log('- 启动命令: ollama serve');
console.log('- 检查命令: curl http://localhost:11434/api/tags');

console.log('\n🧪 测试命令:');
console.log('- 环境检查: node scripts/env-check.js');
console.log('- 基本测试: npm run test:basic');
console.log('- 端到端测试: npm run test:e2e');
console.log('- 性能测试: npm run test:performance');