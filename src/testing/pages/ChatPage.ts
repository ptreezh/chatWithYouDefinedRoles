// 测试页面对象模型
import { Page } from 'playwright'
import { IPageObject } from '../interfaces'

export class ChatPage implements IPageObject {
  page: Page
  url: string

  constructor(page: Page, url: string = 'http://localhost:3000') {
    this.page = page
    this.url = url
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url)
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(options?: any): Promise<Buffer> {
    return await this.page.screenshot(options)
  }

  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector)
  }

  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector)
  }

  async typeText(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text)
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || ''
  }

  // Chat4特定的交互方法
  async sendMessage(message: string): Promise<void> {
    await this.typeText('[data-testid="message-input"]', message)
    await this.clickElement('[data-testid="send-button"]')
  }

  async waitForResponse(): Promise<string> {
    // 等待AI响应出现
    await this.page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 })
    return await this.getText('[data-testid="ai-response"]')
  }

  async getChatHistory(): Promise<string[]> {
    const messages = await this.page.$$('.message')
    const texts: string[] = []
    
    for (const message of messages) {
      const text = await message.textContent()
      if (text) {
        texts.push(text)
      }
    }
    
    return texts
  }
}