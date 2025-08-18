import { Browser, Page } from 'playwright'
import { ChatPage } from '../pages/ChatPage'

export class E2ETestSuite {
  private browser: Browser
  private page: Page
  private chatPage: ChatPage

  constructor(browser: Browser) {
    this.browser = browser
    this.page = null
    this.chatPage = null
  }

  async setup(): Promise<void> {
    this.page = await this.browser.newPage()
    this.chatPage = new ChatPage(this.page)
  }

  async teardown(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
  }

  async runAllTests(): Promise<void> {
    await this.setup()
    
    try {
      await this.testHomepageLoad()
      await this.testBasicChatFlow()
      await this.testUIElements()
    } finally {
      await this.teardown()
    }
  }

  private async testHomepageLoad(): Promise<void> {
    console.log('Testing homepage load...')
    
    // 导航到首页
    await this.chatPage.navigate()
    await this.chatPage.waitForLoad()
    
    // 检查关键元素是否存在
    const isChatInputVisible = await this.chatPage.isElementVisible('[data-testid="message-input"]')
    const isSendButtonVisible = await this.chatPage.isElementVisible('[data-testid="send-button"]')
    
    if (!isChatInputVisible || !isSendButtonVisible) {
      throw new Error('Homepage elements not visible')
    }
    
    console.log('Homepage load test passed')
  }

  private async testBasicChatFlow(): Promise<void> {
    console.log('Testing basic chat flow...')
    
    // 发送消息
    await this.chatPage.sendMessage('Hello, this is a test message')
    
    // 等待响应
    const response = await this.chatPage.waitForResponse()
    
    // 验证响应
    if (response.length === 0) {
      throw new Error('No response received from chat')
    }
    
    console.log('Basic chat flow test passed')
  }

  private async testUIElements(): Promise<void> {
    console.log('Testing UI elements...')
    
    // 检查各种UI元素
    const elementsToCheck = [
      '[data-testid="message-input"]',
      '[data-testid="send-button"]',
      '[data-testid="chat-history"]',
      '[data-testid="character-selector"]',
      '[data-testid="theme-selector"]'
    ]
    
    for (const selector of elementsToCheck) {
      const isVisible = await this.chatPage.isElementVisible(selector)
      if (!isVisible) {
        throw new Error(`UI element not visible: ${selector}`)
      }
    }
    
    console.log('UI elements test passed')
  }
}