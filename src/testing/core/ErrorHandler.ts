import { IErrorHandler } from '../interfaces'
import { TestError, ErrorRecoveryStrategy } from '../types'

export class ErrorHandler implements IErrorHandler {
  async handleError(error: TestError, strategy: ErrorRecoveryStrategy): Promise<void> {
    // 记录错误详情
    await this.logError(error)
    
    // 尝试恢复
    if (strategy.retryCount > 0) {
      await this.retry(() => {
        throw new Error('Retry placeholder')
      }, strategy)
    }
    
    // 执行回退策略
    if (strategy.fallbackAction) {
      await strategy.fallbackAction()
    }
    
    // 发送通知
    if (strategy.notifyOnError) {
      await this.notifyError(error)
    }
  }

  async logError(error: TestError): Promise<void> {
    console.error('Test Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      context: error.context
    })
  }

  async retry<T>(fn: () => Promise<T>, strategy: ErrorRecoveryStrategy): Promise<T> {
    let lastError: Error | null = null
    
    for (let i = 0; i <= strategy.retryCount; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        console.warn(`Attempt ${i + 1} failed:`, error.message)
        
        if (i < strategy.retryCount) {
          console.log(`Retrying in ${strategy.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, strategy.retryDelay))
        }
      }
    }
    
    throw lastError
  }

  async notifyError(error: TestError): Promise<void> {
    // 简化的错误通知实现
    console.log(`Error notification sent: ${error.message}`)
  }
}