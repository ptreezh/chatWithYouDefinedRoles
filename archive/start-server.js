const { execSync, spawn } = require('child_process');
const fs = require('fs');

// 检查端口是否被占用
function checkPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    if (result) {
      const lines = result.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        // 提取PID
        const match = lines[0].match(/LISTENING\\s+(\\d+)/);
        if (match) {
          return match[1];
        }
      }
    }
  } catch (error) {
    // 端口未被占用
    return null;
  }
  return null;
}

// 杀掉占用端口的进程
function killProcess(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    console.log(`成功终止进程 ${pid}`);
  } catch (error) {
    console.error(`无法终止进程 ${pid}:`, error.message);
  }
}

// 启动服务器
function startServer() {
  const port = 3000;
  const pid = checkPort(port);
  
  if (pid) {
    console.log(`端口 ${port} 被进程 ${pid} 占用，正在终止...`);
    killProcess(pid);
  }
  
  // 等待一会儿确保端口释放
  setTimeout(() => {
    console.log('正在启动服务器...');
    
    // 启动Next.js开发服务器
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
  }, 2000);
}

startServer();