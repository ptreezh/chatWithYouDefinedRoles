#!/usr/bin/env node

/**
 * Quick Deployment Script for Chat4
 * Supports multiple deployment methods with one command
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class QuickDeploy {
    constructor() {
        this.projectDir = process.cwd();
        this.config = this.loadConfig();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🚀';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    loadConfig() {
        const configPath = path.join(this.projectDir, 'deploy.config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {
            deployment: {
                type: 'docker',
                domain: '',
                ssl: true,
                ollama: true
            },
            database: {
                type: 'sqlite',
                url: 'file:./db/custom.db'
            },
            ai: {
                provider: 'ollama',
                model: 'llama2',
                apiKey: ''
            }
        };
    }

    saveConfig() {
        const configPath = path.join(this.projectDir, 'deploy.config.json');
        fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    }

    async checkPrerequisites() {
        this.log('检查部署前置条件...');
        
        const checks = [
            { name: 'Node.js', command: 'node --version', required: true },
            { name: 'npm', command: 'npm --version', required: true },
            { name: 'git', command: 'git --version', required: true },
            { name: 'Docker', command: 'docker --version', required: false },
            { name: 'Ollama', command: 'ollama --version', required: false }
        ];

        const results = [];
        for (const check of checks) {
            try {
                const output = execSync(check.command, { encoding: 'utf8', stdio: 'pipe' });
                results.push({
                    name: check.name,
                    installed: true,
                    version: output.trim()
                });
                this.log(`✅ ${check.name}: ${output.trim()}`);
            } catch (error) {
                results.push({
                    name: check.name,
                    installed: false,
                    error: error.message
                });
                if (check.required) {
                    this.log(`❌ ${check.name}: 未安装`, 'error');
                } else {
                    this.log(`⚠️ ${check.name}: 未安装 (可选)`);
                }
            }
        }

        const requiredInstalled = results.filter(r => r.required && !r.installed).length;
        if (requiredInstalled > 0) {
            this.log('缺少必需的依赖，请安装后重试', 'error');
            return false;
        }

        this.log('前置条件检查完成', 'success');
        return true;
    }

    async installDependencies() {
        this.log('安装项目依赖...');
        
        try {
            execSync('npm install', { stdio: 'inherit', cwd: this.projectDir });
            this.log('依赖安装完成', 'success');
            return true;
        } catch (error) {
            this.log(`依赖安装失败: ${error.message}`, 'error');
            return false;
        }
    }

    async buildApplication() {
        this.log('构建应用...');
        
        try {
            execSync('npm run build', { stdio: 'inherit', cwd: this.projectDir });
            execSync('npm run db:generate', { stdio: 'inherit', cwd: this.projectDir });
            this.log('应用构建完成', 'success');
            return true;
        } catch (error) {
            this.log(`应用构建失败: ${error.message}`, 'error');
            return false;
        }
    }

    async setupEnvironment() {
        this.log('配置环境变量...');
        
        const envPath = path.join(this.projectDir, '.env');
        const envTemplate = `NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database Configuration
DATABASE_URL=${this.config.database.url}

# AI Service Configuration
${this.config.ai.provider === 'ollama' ? `OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=${this.config.ai.model}` : ''}
${this.config.ai.apiKey ? `${this.config.ai.provider.toUpperCase()}_API_KEY=${this.config.ai.apiKey}` : ''}

# Security
JWT_SECRET=${this.generateSecret()}
SESSION_SECRET=${this.generateSecret()}
`;

        fs.writeFileSync(envPath, envTemplate);
        this.log('环境变量配置完成', 'success');
        return true;
    }

    generateSecret() {
        return require('crypto').randomBytes(64).toString('hex');
    }

    async deployLocal() {
        this.log('开始本地部署...');
        
        // 启动Ollama (如果配置)
        if (this.config.deployment.ollama) {
            this.log('启动Ollama服务...');
            try {
                execSync('ollama serve > ollama.log 2>&1 &', { 
                    stdio: 'ignore', 
                    cwd: this.projectDir 
                });
                this.log('Ollama服务启动成功');
            } catch (error) {
                this.log('Ollama启动失败，请手动启动: ollama serve', 'error');
            }
        }

        // 启动应用
        try {
            execSync('npm start > server.log 2>&1 &', { 
                stdio: 'ignore', 
                cwd: this.projectDir 
            });
            this.log('应用启动成功', 'success');
            this.log('访问地址: http://localhost:3000');
            return true;
        } catch (error) {
            this.log('应用启动失败', 'error');
            return false;
        }
    }

    async deployPM2() {
        this.log('开始PM2部署...');
        
        // 检查PM2
        try {
            execSync('pm2 --version', { stdio: 'ignore' });
        } catch (error) {
            this.log('PM2未安装，正在安装...', 'info');
            execSync('npm install -g pm2', { stdio: 'inherit' });
        }

        // 创建PM2配置
        const pm2Config = {
            apps: [{
                name: 'chat4',
                script: 'server.js',
                instances: 'max',
                exec_mode: 'cluster',
                env: {
                    NODE_ENV: 'production',
                    PORT: 3000,
                    HOSTNAME: '0.0.0.0'
                },
                error_file: './logs/err.log',
                out_file: './logs/out.log',
                log_file: './logs/combined.log',
                time: true,
                autorestart: true,
                watch: false,
                max_memory_restart: '1G'
            }]
        };

        const pm2ConfigPath = path.join(this.projectDir, 'ecosystem.config.js');
        fs.writeFileSync(pm2ConfigPath, `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);

        // 启动应用
        try {
            execSync('pm2 start ecosystem.config.js', { stdio: 'inherit', cwd: this.projectDir });
            this.log('PM2部署成功', 'success');
            this.log('访问地址: http://localhost:3000');
            this.log('管理命令: pm2 monit');
            return true;
        } catch (error) {
            this.log('PM2部署失败', 'error');
            return false;
        }
    }

    async deployDocker() {
        this.log('开始Docker部署...');
        
        // 创建Dockerfile
        const dockerfile = `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npm run db:generate

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs .next
COPY --chown=nextjs:nodejs db
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`;

        fs.writeFileSync(path.join(this.projectDir, 'Dockerfile'), dockerfile);

        // 创建docker-compose.yml
        const dockerCompose = `version: '3.8'

services:
  chat4:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/db/custom.db
    volumes:
      - ./db:/app/db
      - ./storage:/app/storage
    restart: unless-stopped`;

        if (this.config.deployment.ollama) {
            dockerCompose += `
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:`;
        }

        fs.writeFileSync(path.join(this.projectDir, 'docker-compose.yml'), dockerCompose);

        // 构建和启动
        try {
            execSync('docker-compose build', { stdio: 'inherit', cwd: this.projectDir });
            execSync('docker-compose up -d', { stdio: 'inherit', cwd: this.projectDir });
            this.log('Docker部署成功', 'success');
            this.log('访问地址: http://localhost:3000');
            this.log('管理命令: docker-compose logs -f');
            return true;
        } catch (error) {
            this.log('Docker部署失败', 'error');
            return false;
        }
    }

    async deployVercel() {
        this.log('开始Vercel部署...');
        
        // 检查Vercel CLI
        try {
            execSync('vercel --version', { stdio: 'ignore' });
        } catch (error) {
            this.log('Vercel CLI未安装，正在安装...', 'info');
            execSync('npm install -g vercel', { stdio: 'inherit' });
        }

        try {
            // 登录Vercel
            execSync('vercel login', { stdio: 'inherit', cwd: this.projectDir });
            
            // 部署
            execSync('vercel --prod', { stdio: 'inherit', cwd: this.projectDir });
            
            this.log('Vercel部署成功', 'success');
            this.log('请访问 Vercel 控制台查看部署详情');
            return true;
        } catch (error) {
            this.log('Vercel部署失败', 'error');
            return false;
        }
    }

    async postDeployment() {
        this.log('执行部署后检查...');
        
        // 等待服务启动
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 健康检查
        try {
            const response = await fetch('http://localhost:3000/api/health');
            if (response.ok) {
                const health = await response.json();
                this.log('健康检查通过', 'success');
                this.log(`服务状态: ${health.status}`);
                this.log(`数据库: ${health.database}`);
                if (health.ollama) {
                    this.log(`Ollama: ${health.ollama.status}`);
                }
            } else {
                this.log('健康检查失败', 'error');
            }
        } catch (error) {
            this.log('健康检查无法连接', 'error');
        }

        // 运行基础测试
        try {
            this.log('运行基础测试...');
            execSync('npm run test:basic', { stdio: 'inherit', cwd: this.projectDir });
        } catch (error) {
            this.log('基础测试失败，但部署可能仍然成功', 'error');
        }
    }

    async interactiveSetup() {
        this.log('交互式部署设置');
        this.log('=' .repeat(40));
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // 选择部署方式
        const deploymentTypes = [
            { key: 'local', name: '本地部署', description: '适合开发和测试' },
            { key: 'pm2', name: 'PM2进程管理', description: '适合生产环境' },
            { key: 'docker', name: 'Docker容器化', description: '适合容器化部署' },
            { key: 'vercel', name: 'Vercel云平台', description: '适合Serverless部署' }
        ];

        console.log('请选择部署方式:');
        deploymentTypes.forEach((type, index) => {
            console.log(`${index + 1}. ${type.name} - ${type.description}`);
        });

        const choice = await new Promise(resolve => {
            rl.question('请输入选择 (1-4): ', answer => {
                rl.close();
                resolve(parseInt(answer) - 1);
            });
        });

        this.config.deployment.type = deploymentTypes[choice].key;

        // 配置数据库
        console.log('\n请选择数据库类型:');
        console.log('1. SQLite (默认，简单易用)');
        console.log('2. PostgreSQL (生产环境推荐)');
        console.log('3. MySQL (生产环境)');

        const dbChoice = await new Promise(resolve => {
            const dbRl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            dbRl.question('请输入选择 (1-3): ', answer => {
                dbRl.close();
                resolve(parseInt(answer));
            });
        });

        const dbTypes = ['sqlite', 'postgresql', 'mysql'];
        this.config.database.type = dbTypes[dbChoice - 1];

        // 配置AI服务
        console.log('\n请选择AI服务:');
        console.log('1. Ollama (本地模型，推荐)');
        console.log('2. Z.ai (云服务)');
        console.log('3. OpenAI (云服务)');

        const aiChoice = await new Promise(resolve => {
            const aiRl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            aiRl.question('请输入选择 (1-3): ', answer => {
                aiRl.close();
                resolve(parseInt(answer));
            });
        });

        const aiProviders = ['ollama', 'zai', 'openai'];
        this.config.ai.provider = aiProviders[aiChoice - 1];

        if (this.config.ai.provider !== 'ollama') {
            const apiKey = await new Promise(resolve => {
                const keyRl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                keyRl.question(`请输入${this.config.ai.provider.toUpperCase()} API密钥: `, answer => {
                    keyRl.close();
                    resolve(answer);
                });
            });
            this.config.ai.apiKey = apiKey;
        }

        this.saveConfig();
        this.log('配置已保存', 'success');
    }

    async deploy() {
        console.log('🚀 Chat4 快速部署工具');
        console.log('=' .repeat(50));

        // 交互式设置
        await this.interactiveSetup();

        // 检查前置条件
        if (!await this.checkPrerequisites()) {
            this.log('前置条件检查失败，请修复后重试', 'error');
            process.exit(1);
        }

        // 安装依赖
        if (!await this.installDependencies()) {
            this.log('依赖安装失败', 'error');
            process.exit(1);
        }

        // 构建应用
        if (!await this.buildApplication()) {
            this.log('应用构建失败', 'error');
            process.exit(1);
        }

        // 配置环境
        if (!await this.setupEnvironment()) {
            this.log('环境配置失败', 'error');
            process.exit(1);
        }

        // 根据配置选择部署方式
        let deploySuccess = false;
        switch (this.config.deployment.type) {
            case 'local':
                deploySuccess = await this.deployLocal();
                break;
            case 'pm2':
                deploySuccess = await this.deployPM2();
                break;
            case 'docker':
                deploySuccess = await this.deployDocker();
                break;
            case 'vercel':
                deploySuccess = await this.deployVercel();
                break;
            default:
                this.log('不支持的部署方式', 'error');
                process.exit(1);
        }

        if (deploySuccess) {
            await this.postDeployment();
            this.log('🎉 部署成功完成！', 'success');
            this.log('=' .repeat(50));
            this.log('📋 部署信息:');
            this.log(`部署方式: ${this.config.deployment.type}`);
            this.log(`数据库: ${this.config.database.type}`);
            this.log(`AI服务: ${this.config.ai.provider}`);
            this.log(`访问地址: http://localhost:3000`);
            this.log('');
            this.log('🔧 管理命令:');
            if (this.config.deployment.type === 'pm2') {
                this.log('pm2 monit    # 监控应用');
                this.log('pm2 logs     # 查看日志');
                this.log('pm2 restart  # 重启应用');
            } else if (this.config.deployment.type === 'docker') {
                this.log('docker-compose logs -f    # 查看日志');
                this.log('docker-compose restart    # 重启服务');
                this.log('docker-compose down        # 停止服务');
            }
            this.log('');
            this.log('🧪 测试命令:');
            this.log('npm run test:basic          # 基础测试');
            this.log('npm run test:e2e            # 端到端测试');
            this.log('npm run test:performance    # 性能测试');
        } else {
            this.log('❌ 部署失败', 'error');
            process.exit(1);
        }
    }
}

// 运行部署
if (require.main === module) {
    const deployer = new QuickDeploy();
    deployer.deploy().catch(error => {
        console.error('部署失败:', error);
        process.exit(1);
    });
}

module.exports = QuickDeploy;