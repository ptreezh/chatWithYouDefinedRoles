const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProjectAnalyzer {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  analyze() {
    console.log('🔍 开始分析项目架构...\n');
    
    this.checkDependencies();
    this.checkConfiguration();
    this.checkStructure();
    this.generateReport();
  }

  checkDependencies() {
    console.log('📦 检查依赖包...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
      
      // 检查缺失的关键依赖
      const requiredDeps = [
        'react', 'react-dom', 'next', 'typescript', 
        '@types/node', '@types/react', '@types/react-dom',
        'tailwindcss', 'postcss', 'autoprefixer',
        'tw-animate-css', 'prisma', '@prisma/client'
      ];
      
      const installedDeps = new Set([
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ]);
      
      const missingDeps = requiredDeps.filter(dep => !installedDeps.has(dep));
      
      if (missingDeps.length > 0) {
        this.issues.push({
          type: 'missing_dependencies',
          severity: 'critical',
          message: `缺失关键依赖包: ${missingDeps.join(', ')}`,
          fix: `npm install ${missingDeps.join(' ')}`
        });
      }
      
      console.log('✅ 依赖检查完成');
    } catch (error) {
      this.issues.push({
        type: 'dependency_error',
        severity: 'critical',
        message: `无法读取依赖配置: ${error.message}`
      });
    }
  }

  checkConfiguration() {
    console.log('⚙️ 检查配置文件...');
    
    // 检查 Next.js 配置
    if (fs.existsSync('next.config.ts')) {
      const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
      if (nextConfig.includes('ignoreBuildErrors: true')) {
        this.issues.push({
          type: 'config_warning',
          severity: 'high',
          message: 'Next.js 配置中禁用了构建错误检查，可能导致运行时问题'
        });
      }
    }
    
    // 检查 TypeScript 配置
    if (fs.existsSync('tsconfig.json')) {
      const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      if (!tsConfig.compilerOptions.baseUrl || !tsConfig.compilerOptions.paths) {
        this.issues.push({
          type: 'config_missing',
          severity: 'medium',
          message: 'TypeScript 路径映射配置不完整',
          fix: '添加 baseUrl 和 paths 配置到 tsconfig.json'
        });
      }
    }
    
    console.log('✅ 配置检查完成');
  }

  checkStructure() {
    console.log('🏗️ 检查项目结构...');
    
    // 检查关键目录
    const requiredDirs = [
      'src/app', 'src/components', 'src/lib', 
      'src/hooks', 'prisma', 'public'
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        this.issues.push({
          type: 'missing_directory',
          severity: 'medium',
          message: `缺少必要目录: ${dir}`
        });
      }
    }
    
    // 检查数据库配置
    if (!fs.existsSync('.env')) {
      this.issues.push({
        type: 'missing_env',
        severity: 'high',
        message: '缺少环境变量配置文件',
        fix: '创建 .env 文件并配置必要的环境变量'
      });
    }
    
    console.log('✅ 结构检查完成');
  }

  generateReport() {
    console.log('\n📊 分析报告\n');
    console.log('='.repeat(50));
    
    // 统计问题严重程度
    const severityCount = {
      critical: this.issues.filter(i => i.severity === 'critical').length,
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length
    };
    
    console.log(`🚨 严重问题: ${severityCount.critical}`);
    console.log(`⚠️  高优先级: ${severityCount.high}`);
    console.log(`📝 中优先级: ${severityCount.medium}`);
    console.log(`ℹ️  低优先级: ${severityCount.low}`);
    
    console.log('\n🔧 详细问题列表:');
    this.issues.forEach((issue, index) => {
      const emoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📝',
        low: 'ℹ️'
      }[issue.severity];
      
      console.log(`\n${emoji} [${issue.type}] ${issue.message}`);
      if (issue.fix) {
        console.log(`   解决方案: ${issue.fix}`);
      }
    });
    
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 重构建议\n');
    console.log('='.repeat(50));
    
    console.log('1. 📦 依赖管理优化:');
    console.log('   - 安装缺失的依赖包');
    console.log('   - 使用固定版本号避免兼容性问题');
    console.log('   - 添加开发依赖支持');
    
    console.log('\n2. ⚙️ 配置文件优化:');
    console.log('   - 启用 Next.js 严格模式');
    console.log('   - 完善 TypeScript 路径映射');
    console.log('   - 添加 ESLint 和 Prettier 配置');
    
    console.log('\n3. 🏗️ 架构重构建议:');
    console.log('   - 统一使用 Next.js 标准架构');
    console.log('   - 实现完整的 TDD 测试框架');
    console.log('   - 优化数据库连接和模型定义');
    
    console.log('\n4. 🧪 测试策略:');
    console.log('   - 单元测试覆盖核心业务逻辑');
    console.log('   - 集成测试覆盖 API 端点');
    console.log('   - E2E 测试覆盖用户流程');
    
    console.log('\n5. 📊 监控和日志:');
    console.log('   - 添加健康检查端点');
    console.log('   - 实现错误追踪');
    console.log('   - 添加性能监控');
  }
}

// 运行分析
const analyzer = new ProjectAnalyzer();
analyzer.analyze();

module.exports = ProjectAnalyzer;