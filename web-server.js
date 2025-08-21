#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '127.0.0.1';

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

// 创建HTTP服务器
const server = http.createServer((request, response) => {
  // 解析URL
  const url = new URL(request.url, `http://${request.headers.host}`);
  let filePath = url.pathname;

  // 如果是根路径，返回测试页面
  if (filePath === '/' || filePath === '') {
    filePath = '/test-multiuser.html';
  }

  // 构建完整的文件路径
  filePath = path.join(__dirname, filePath);

  // 获取文件扩展名
  const extname = path.extname(filePath);
  let contentType = mimeTypes[extname] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        response.writeHead(404, { 'Content-Type': 'text/html' });
        response.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - 页面未找到</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #d32f2f; }
              a { color: #1976d2; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404 - 页面未找到</h1>
            <p>抱歉，您访问的页面不存在。</p>
            <p><a href="/">返回首页</a></p>
          </body>
          </html>
        `);
      } else {
        // 服务器错误
        response.writeHead(500, { 'Content-Type': 'text/html' });
        response.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>500 - 服务器错误</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1>500 - 服务器错误</h1>
            <p>抱歉，服务器内部错误。</p>
          </body>
          </html>
        `);
      }
    } else {
      // 成功响应
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log(`🚀 Chat4 测试页面服务器启动成功！`);
  console.log(`🌐 访问地址: http://${HOST}:${PORT}`);
  console.log(`📝 测试页面: http://${HOST}:${PORT}/`);
  console.log(`🔧 API服务器: http://127.0.0.1:4000`);
  console.log(`\n💡 现在你可以通过浏览器正常访问测试页面了！`);
});