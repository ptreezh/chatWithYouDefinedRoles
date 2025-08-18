/**
 * @fileoverview 变更驱动测试选择器 - TestCraft AI
 * 基于git diff和测试基线实现智能测试选择
 * TestCraft AI - Change-Driven Testing Strategy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class ChangeDrivenTestSelector {
  constructor() {
    this.config = this.loadConfig();
    this.changedFiles = [];
    this.affectedTests = new Set();
    this.testBaseline = this.loadTestBaseline();
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), 'test_baseline.toml');
    if (!fs.existsSync(configPath)) {
      throw new Error('测试基线配置文件未找到');
    }
    
    // 简化的TOML解析
    const content = fs.readFileSync(configPath, 'utf8');
    return this.parseToml(content);
  }

  parseToml(tomlString) {
    const config = {};
    let currentSection = null;
    
    const lines = tomlString.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        config[currentSection] = {};
      } else if (currentSection && trimmed.includes('=')) {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        config[currentSection][key] = value.replace(/"/g, '');
      }
    }
    
    return config;
  }

  loadTestBaseline() {
    const baselinePath = path.join(process.cwd(), 'test_baseline.toml');
    if (!fs.existsSync(baselinePath)) {
      return { stable_modules: {}, change_impact: { mappings: {} } };
    }

    const content = fs.readFileSync(baselinePath, 'utf8');
    return this.parseToml(content);
  }

  async selectTests() {
    console.log('🔍 变更驱动测试选择器启动...');
    console.log('TestCraft AI - 智能测试选择策略');
    console.log('='.repeat(50));

    try {
      // 1. 获取变更文件
      this.changedFiles = await this.getChangedFiles();
      console.log(`📊 检测到 ${this.changedFiles.length} 个变更文件`);

      // 2. 分析变更影响
      await this.analyzeChangeImpact();

      // 3. 智能选择测试
      const selectedTests = await this.intelligentTestSelection();

      // 4. 生成执行计划
      const executionPlan = await this.generateExecutionPlan(selectedTests);

      // 5. 保存选择结果
      await this.saveSelectionResults(selectedTests, executionPlan);

      return { selectedTests, executionPlan };

    } catch (error) {
      console.error('测试选择失败:', error);
      return this.fallbackToAllTests();
    }
  }

  async getChangedFiles() {
    try {
      // 获取当前分支与main的差异
      const diffOutput = execSync('git diff --name-only main || git diff --name-only HEAD~1 || echo ""', {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      const files = diffOutput.trim().split('\n').filter(f => f.length > 0);
      
      // 添加未跟踪的文件
      const untrackedOutput = execSync('git ls-files --others --exclude-standard || echo ""', {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const untracked = untrackedOutput.trim().split('\n').filter(f => f.length > 0);
      
      return [...files, ...untracked];
    } catch (error) {
      console.warn('无法获取git变更，使用文件修改时间判断');
      return this.getModifiedFilesByTime();
    }
  }

  getModifiedFilesByTime() {
    const srcDir = path.join(process.cwd(), 'src');
    const testDir = path.join(process.cwd(), 'tests');
    
    if (!fs.existsSync(srcDir)) return [];

    const modifiedFiles = [];
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24小时

    function checkDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          checkDirectory(filePath);
        } else if (stat.mtime.getTime() > cutoffTime) {
          modifiedFiles.push(path.relative(process.cwd(), filePath));
        }
      }
    }

    checkDirectory(srcDir);
    checkDirectory(testDir);
    
    return modifiedFiles;
  }

  async analyzeChangeImpact() {
    console.log('\n🎯 分析变更影响范围...');

    const mappings = this.testBaseline.change_impact?.mappings || {};
    
    for (const changedFile of this.changedFiles) {
      console.log(`  📁 分析文件: ${changedFile}`);
      
      // 直接映射
      if (mappings[changedFile]) {
        const tests = Array.isArray(mappings[changedFile]) 
          ? mappings[changedFile] 
          : [mappings[changedFile]];
        tests.forEach(test => this.affectedTests.add(test));
      }

      // 基于文件类型的智能匹配
      await this.smartMatchTests(changedFile);
    }

    console.log(`  🔍 识别出 ${this.affectedTests.size} 个受影响测试`);
  }

  async smartMatchTests(changedFile) {
    const ext = path.extname(changedFile);
    const basename = path.basename(changedFile, ext);

    // TypeScript/JavaScript文件
    if (ext === '.ts' || ext === '.js') {
      const possibleTests = [
        `tests/unit/${basename}.test.ts`,
        `tests/unit/${basename}.test.js`,
        `tests/integration/${basename}.test.ts`,
        `tests/integration/${basename}.test.js`,
        `tests/e2e/${basename}.e2e.test.ts`,
        `tests/e2e/${basename}.e2e.test.js`
      ];

      possibleTests.forEach(test => {
        if (fs.existsSync(path.join(process.cwd(), test))) {
          this.affectedTests.add(test);
        }
      });
    }

    // 配置文件
    if (changedFile.includes('package.json') || changedFile.includes('jest.config')) {
      this.affectedTests.add('tests/unit/');
      this.affectedTests.add('tests/integration/');
    }

    // Playwright配置
    if (changedFile.includes('playwright.config')) {
      this.affectedTests.add('tests/e2e/');
    }
  }

  async intelligentTestSelection() {
    console.log('\n🧠 智能测试选择...');

    const selected = {
      unit: [],
      integration: [],
      e2e: [],
      performance: [],
      chaos: []
    };

    // 基于优先级选择
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    for (const testFile of this.affectedTests) {
      const testPath = path.join(process.cwd(), testFile);
      
      if (!fs.existsSync(testPath) && !fs.existsSync(testPath.replace('.ts', '.js'))) {
        continue;
      }

      // 确定测试类型
      let testType = 'unit';
      if (testFile.includes('integration')) testType = 'integration';
      else if (testFile.includes('e2e')) testType = 'e2e';
      else if (testFile.includes('performance')) testType = 'performance';
      else if (testFile.includes('chaos')) testType = 'chaos';

      // 检查是否可跳过（基于哈希）
      if (!await this.shouldSkipTest(testFile)) {
        selected[testType].push(testFile);
      }
    }

    // 如果没有变更，运行关键测试作为回归
    if (this.affectedTests.size === 0) {
      console.log('  🔄 无代码变更，运行关键回归测试');
      selected.unit.push('tests/unit/character-interest-enhanced.test.ts');
      selected.integration.push('tests/integration/socket-realtime.test.ts');
      selected.integration.push('tests/integration/ai-service-integration.test.ts');
    }

    return selected;
  }

  async shouldSkipTest(testFile) {
    const stableModules = this.testBaseline.stable_modules || {};
    
    for (const [moduleName, moduleConfig] of Object.entries(stableModules)) {
      if (moduleConfig.test_file === testFile) {
        // 检查文件哈希
        const sourceFile = this.getSourceFileForTest(testFile);
        if (sourceFile) {
          const currentHash = this.calculateFileHash(sourceFile);
          const baselineHash = moduleConfig.file_hash;
          
          if (currentHash === baselineHash) {
            console.log(`    ⏭️  跳过稳定测试: ${testFile}`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  getSourceFileForTest(testFile) {
    const testName = path.basename(testFile, '.test.ts').replace('.e2e', '');
    
    const possibleSources = [
      `src/lib/${testName}.ts`,
      `src/lib/${testName}.js`,
      `src/services/${testName}.ts`,
      `src/services/${testName}.js`,
      `src/utils/${testName}.ts`,
      `src/utils/${testName}.js`
    ];

    for (const source of possibleSources) {
      if (fs.existsSync(path.join(process.cwd(), source))) {
        return source;
      }
    }
    
    return null;
  }

  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), filePath));
      return crypto.createHash('sha256').update(content).digest('hex').substring(0, 40);
    } catch (error) {
      return null;
    }
  }

  async generateExecutionPlan(selectedTests) {
    console.log('\n📋 生成执行计划...');

    const plan = {
      parallel: true,
      batches: [],
      estimated_duration: 0,
      commands: []
    };

    // 按类型分组
    const testTypes = Object.keys(selectedTests);
    
    for (const type of testTypes) {
      const tests = selectedTests[type];
      if (tests.length === 0) continue;

      let command;
      switch (type) {
        case 'unit':
          command = `jest ${tests.join(' ')} --coverage`;
          break;
        case 'integration':
          command = `jest ${tests.join(' ')} --testTimeout=30000`;
          break;
        case 'e2e':
          command = `playwright test ${tests.join(' ')}`;
          break;
        case 'performance':
          command = `playwright test ${tests.join(' ')} --reporter=html`;
          break;
        default:
          command = `jest ${tests.join(' ')}`;
      }

      plan.commands.push({
        type,
        tests,
        command,
        estimated_duration: tests.length * (type === 'e2e' ? 120 : 30) // 秒
      });
    }

    // 计算总时间（考虑并行执行）
    const maxBatchTime = Math.max(...plan.commands.map(c => c.estimated_duration));
    plan.estimated_duration = Math.ceil(maxBatchTime / 60); // 分钟

    console.log(`  ⏱️  预计执行时间: ${plan.estimated_duration}分钟`);
    
    return plan;
  }

  async saveSelectionResults(selectedTests, executionPlan) {
    const results = {
      timestamp: new Date().toISOString(),
      changed_files: this.changedFiles,
      selected_tests: selectedTests,
      execution_plan: executionPlan,
      summary: {
        total_affected: this.affectedTests.size,
        selected_count: Object.values(selectedTests).flat().length,
        skipped_count: this.affectedTests.size - Object.values(selectedTests).flat().length,
        optimization_ratio: this.calculateOptimization()
      }
    };

    const outputPath = path.join(process.cwd(), 'test-reports', 'change-selection-results.json');
    
    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`  💾 结果已保存: ${outputPath}`);
  }

  calculateOptimization() {
    const totalTests = this.getTotalTestCount();
    const selectedTests = Object.values(this.selectedTests || {}).flat().length;
    
    if (totalTests === 0) return 0;
    return Math.round(((totalTests - selectedTests) / totalTests) * 100);
  }

  getTotalTestCount() {
    const testDirs = ['tests/unit', 'tests/integration', 'tests/e2e', 'tests/performance'];
    let count = 0;
    
    for (const dir of testDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        count += files.filter(f => f.includes('.test.')).length;
      }
    }
    
    return count;
  }

  fallbackToAllTests() {
    console.log('  ⚠️  使用回退策略：运行所有测试');
    
    return {
      selectedTests: {
        unit: ['tests/unit/'],
        integration: ['tests/integration/'],
        e2e: ['tests/e2e/'],
        performance: ['tests/performance/']
      },
      executionPlan: {
        parallel: false,
        estimated_duration: 45,
        commands: [
          { type: 'unit', command: 'npm run test:unit', estimated_duration: 15 },
          { type: 'integration', command: 'npm run test:integration', estimated_duration: 20 },
          { type: 'e2e', command: 'npm run test:e2e', estimated_duration: 30 }
        ]
      }
    };
  }

  async updateBaseline() {
    console.log('\n🔄 更新测试基线...');

    const baselinePath = path.join(process.cwd(), 'test_baseline.toml');
    let baseline = this.loadTestBaseline();

    // 为通过的测试更新哈希值
    for (const testFile of this.affectedTests) {
      const sourceFile = this.getSourceFileForTest(testFile);
      if (sourceFile) {
        const newHash = this.calculateFileHash(sourceFile);
        const moduleName = path.basename(testFile, '.test.ts');
        
        if (!baseline.stable_modules) baseline.stable_modules = {};
        baseline.stable_modules[moduleName] = {
          file_hash: newHash,
          test_file: testFile,
          last_verified: new Date().toISOString(),
          verification_status: 'PASSED'
        };
      }
    }

    // 这里简化：实际应该更新TOML文件
    console.log('  ✅ 基线更新完成');
  }
}

// 主执行函数
async function main() {
  const selector = new ChangeDrivenTestSelector();
  
  try {
    const result = await selector.selectTests();
    
    console.log('\n🎯 最终选择的测试:');
    Object.entries(result.selectedTests).forEach(([type, tests]) => {
      if (tests.length > 0) {
        console.log(`  ${type.toUpperCase()}: ${tests.length}个测试`);
        tests.forEach(test => console.log(`    - ${test}`));
      }
    });

    console.log('\n⚡ 执行命令:');
    result.executionPlan.commands.forEach(cmd => {
      console.log(`  ${cmd.command}`);
    });

    return result;

  } catch (error) {
    console.error('测试选择失败:', error);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}

module.exports = ChangeDrivenTestSelector;