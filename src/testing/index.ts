// 自动化可用性测试入口文件
import { TestScheduler } from './core/TestScheduler'
import { ConfigManager } from './config/ConfigManager'
import { TestConfig } from './types'

async function runAutomatedTests() {
  console.log('🚀 启动自动化可用性测试...')
  
  try {
    // 初始化配置管理器
    const configManager = new ConfigManager()
    
    // 加载测试配置
    const config: TestConfig = await configManager.loadConfig()
    
    console.log('📋 配置加载完成')
    console.log(`🧪 测试类型: ${config.testTypes.join(', ')}`)
    console.log(`🌐 浏览器: ${config.browsers.join(', ')}`)
    console.log(`🌍 环境: ${config.environments.map(env => env.name).join(', ')}`)
    
    // 初始化测试调度器
    const scheduler = new TestScheduler()
    
    // 调度测试执行
    const execution = await scheduler.scheduleTest(config)
    
    console.log(`⏱️  测试已启动，执行ID: ${execution.id}`)
    
    // 轮询测试状态
    const pollInterval = setInterval(async () => {
      const status = await scheduler.getTestStatus(execution.id)
      console.log(`📊 测试状态: ${status}`)
      
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        clearInterval(pollInterval)
        
        if (status === 'completed') {
          console.log('✅ 测试执行完成')
        } else if (status === 'failed') {
          console.log('❌ 测试执行失败')
        } else {
          console.log('🚫 测试已被取消')
        }
      }
    }, 2000)
    
  } catch (error) {
    console.error('❌ 测试执行过程中发生错误:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAutomatedTests()
}

export { runAutomatedTests }