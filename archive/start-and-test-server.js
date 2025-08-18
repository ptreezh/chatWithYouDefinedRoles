// start-and-test-server.js
const { spawn } = require('child_process');
const http = require('http');

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close();
      resolve(false); // 端口未被占用
    });
    server.on('error', () => {
      resolve(true); // 端口被占用
    });
  });
}

// 杀掉占用端口的进程 (Windows)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        console.log(`端口 ${port} 未被占用`);
        resolve();
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const match = lines[0].match(/LISTENING\s+(\d+)/);
        if (match) {
          const pid = match[1];
          console.log(`端口 ${port} 被进程 ${pid} 占用，正在终止...`);
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              console.error(`无法终止进程 ${pid}:`, killError.message);
            } else {
              console.log(`成功终止进程 ${pid}`);
            }
            // 等待一会儿确保端口释放
            setTimeout(resolve, 1000);
          });
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  });
}

// 检查服务是否启动成功
function checkServerStarted() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 30; // 最多尝试30次，每2秒一次
    
    const check = () => {
      attempts++;
      console.log(`检查服务是否启动... (尝试 ${attempts}/${maxAttempts})`);
      
      const req = http.get('http://127.0.0.1:3000/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('✅ 服务启动成功!');
          console.log('请在浏览器中打开 http://localhost:3000 来访问应用');
          resolve(true);
        } else {
          if (attempts < maxAttempts) {
            setTimeout(check, 2000);
          } else {
            console.log('❌ 服务启动超时');
            resolve(false);
          }
        }
      });
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, 2000);
        } else {
          console.log('❌ 服务启动超时');
          resolve(false);
        }
      });
      
      req.setTimeout(1000, () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, 2000);
        } else {
          console.log('❌ 服务启动超时');
          resolve(false);
        }
      });
    };
    
    setTimeout(check, 3000); // 等待3秒后开始检查
  });
}

// 启动服务器
async function startServer() {
  const port = 3000;
  
  console.log('正在检查端口占用情况...');
  await killProcessOnPort(port);
  
  console.log('正在启动服务器...');
  const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    console.log(`服务器进程退出，退出码: ${code}`);
  });
  
  child.on('error', (error) => {
    console.error('启动服务器时出错:', error);
  });
  
  // 等待服务启动
  const started = await checkServerStarted();
  if (started) {
    console.log('\n🎉 服务器已成功启动!');
    console.log('📋 使用说明:');
    console.log('   - 在浏览器中访问 http://localhost:3000');
    console.log('   - 查看上方的日志输出以获取更多信息');
    console.log('   - 按 Ctrl+C 停止服务器');
  } else {
    console.log('\n❌ 服务器启动失败，请检查日志输出');
  }
}

startServer();