import { IConfigManager } from '../interfaces'
import { TestConfig } from '../types'
import * as fs from 'fs/promises'
import * as path from 'path'

export class ConfigManager implements IConfigManager {
  private configPath: string
  private defaultConfig: TestConfig

  constructor(configPath: string = 'test-config.json') {
    this.configPath = configPath
    this.defaultConfig = this.getDefaultConfig()
  }

  async loadConfig(path?: string): Promise<TestConfig> {
    const configPath = path || this.configPath
    
    try {
      // 检查配置文件是否存在
      await fs.access(configPath)
      
      // 读取配置文件
      const configFile = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(configFile)
      
      // 验证配置
      if (await this.validateConfig(config)) {
        // 合并默认配置和用户配置
        return this.mergeConfigs(this.defaultConfig, config)
      } else {
        console.warn('配置文件无效，使用默认配置')
        return this.defaultConfig
      }
    } catch (error) {
      console.warn(`无法加载配置文件: ${error.message}，使用默认配置`)
      return this.defaultConfig
    }
  }

  async saveConfig(config: TestConfig, path?: string): Promise<void> {
    const configPath = path || this.configPath
    
    // 验证配置
    if (!(await this.validateConfig(config))) {
      throw new Error('Invalid configuration')
    }
    
    // 保存配置到文件
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }

  async validateConfig(config: TestConfig): Promise<boolean> {
    // 检查必需的字段
    if (!config.testTypes || !Array.isArray(config.testTypes)) {
      return false
    }
    
    if (!config.browsers || !Array.isArray(config.browsers)) {
      return false
    }
    
    if (!config.environments || !Array.isArray(config.environments)) {
      return false
    }
    
    // 验证测试类型
    const validTestTypes = ['ui', 'performance', 'accessibility', 'responsive']
    for (const type of config.testTypes) {
      if (!validTestTypes.includes(type)) {
        return false
      }
    }
    
    // 验证浏览器类型
    const validBrowsers = ['chrome', 'firefox', 'edge', 'safari']
    for (const browser of config.browsers) {
      if (!validBrowsers.includes(browser)) {
        return false
      }
    }
    
    // 验证环境配置
    for (const env of config.environments) {
      if (!env.name || !env.baseUrl) {
        return false
      }
    }
    
    // 验证通知配置（如果存在）
    if (config.notifications) {
      if (config.notifications.email && config.notifications.email.enabled) {
        const email = config.notifications.email
        if (!email.recipients || !Array.isArray(email.recipients) || email.recipients.length === 0) {
          return false
        }
        
        if (!email.smtp || !email.smtp.host || !email.smtp.port) {
          return false
        }
      }
      
      if (config.notifications.webhook && config.notifications.webhook.enabled) {
        if (!config.notifications.webhook.url) {
          return false
        }
      }
    }
    
    return true
  }

  getDefaultConfig(): TestConfig {
    return {
      testTypes: ['ui', 'performance', 'accessibility', 'responsive'],
      browsers: ['chrome'],
      environments: [
        {
          name: 'local',
          baseUrl: 'http://localhost:3000'
        }
      ],
      notifications: {
        email: {
          enabled: false,
          recipients: [],
          smtp: {
            host: '',
            port: 587,
            secure: false,
            auth: {
              user: '',
              pass: ''
            }
          }
        },
        webhook: {
          enabled: false,
          url: '',
          headers: {}
        }
      },
      timeout: 30000,
      retries: 2,
      parallel: true,
      maxConcurrency: 5
    }
  }

  mergeConfigs(base: TestConfig, override: Partial<TestConfig>): TestConfig {
    return {
      ...base,
      ...override,
      environments: override.environments || base.environments,
      notifications: {
        ...base.notifications,
        ...override.notifications,
        email: override.notifications?.email ? {
          ...base.notifications.email,
          ...override.notifications.email,
          smtp: override.notifications.email.smtp ? {
            ...base.notifications.email.smtp,
            ...override.notifications.email.smtp
          } : base.notifications.email.smtp
        } : base.notifications.email,
        webhook: override.notifications?.webhook ? {
          ...base.notifications.webhook,
          ...override.notifications.webhook
        } : base.notifications.webhook
      }
    }
  }
}