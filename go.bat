@echo off
chcp 65001 > nul
echo 已设置UTF-8编码

echo 正在检查3000端口占用情况...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo 终止占用3000端口的进程: %%a
    taskkill /PID %%a /F > nul 2>&1
)

echo 正在启动服务器...
npx tsx server.ts