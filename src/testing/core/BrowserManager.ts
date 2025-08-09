import { Browser, chromium, firefox, webkit } from 'playwright'
import { IBrowserManager } from '../interfaces'
import { BrowserType, BrowserOptions, BrowserStatus, ScreenshotOptions } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class BrowserManager implements IBrowserManager {
  private browsers: Map<string, { browser: Browser; status: BrowserStatus }> = new Map()

  async launchBrowser(type: BrowserType, options: BrowserOptions): Promise<Browser> {
    const browserId = uuidv4()
    
    let browser: Browser
    
    try {
      const launchOptions = {
        headless: options.headless,
        viewport: options.viewport,
        locale: options.locale,
        timezoneId: options.timezone
      }

      switch (type) {
        case 'chrome':
          browser = await chromium.launch(launchOptions)
          break
        case 'firefox':
          browser = await firefox.launch(launchOptions)
          break
        case 'edge':
          browser = await chromium.launch({
            ...launchOptions,
            channel: 'msedge'
          })
          break
        case 'safari':
          browser = await webkit.launch(launchOptions)
          break
        default:
          throw new Error(`Unsupported browser type: ${type}`)
      }

      const status: BrowserStatus = {
        id: browserId,
        type,
        status: 'ready',
        pid: browser.process()?.pid
      }

      this.browsers.set(browserId, { browser, status })
      
      // 监听浏览器关闭事件
      browser.on('disconnected', () => {
        this.browsers.delete(browserId)
      })

      return browser
    } catch (error) {
      console.error(`Failed to launch ${type} browser:`, error)
      throw error
    }
  }

  async closeBrowser(browserId: string): Promise<void> {
    const browserInfo = this.browsers.get(browserId)
    if (browserInfo) {
      browserInfo.status.status = 'closing'
      await browserInfo.browser.close()
      this.browsers.delete(browserId)
    }
  }

  async getBrowserStatus(browserId: string): Promise<BrowserStatus> {
    const browserInfo = this.browsers.get(browserId)
    if (!browserInfo) {
      throw new Error(`Browser not found: ${browserId}`)
    }
    return browserInfo.status
  }

  async takeScreenshot(browserId: string, options: ScreenshotOptions): Promise<Buffer> {
    const browserInfo = this.browsers.get(browserId)
    if (!browserInfo) {
      throw new Error(`Browser not found: ${browserId}`)
    }

    const pages = browserInfo.browser.contexts()[0]?.pages() || []
    if (pages.length === 0) {
      throw new Error('No active pages in browser')
    }

    const page = pages[0]
    return await page.screenshot({
      fullPage: options.fullPage,
      quality: options.quality,
      type: options.format,
      clip: options.clip
    })
  }

  async listBrowsers(): Promise<BrowserStatus[]> {
    return Array.from(this.browsers.values()).map(info => info.status)
  }

  async cleanupBrowsers(): Promise<void> {
    const closePromises = Array.from(this.browsers.keys()).map(id => 
      this.closeBrowser(id).catch(error => 
        console.error(`Failed to close browser ${id}:`, error)
      )
    )
    
    await Promise.all(closePromises)
    this.browsers.clear()
  }

  // 获取浏览器实例（内部使用）
  getBrowser(browserId: string): Browser | undefined {
    return this.browsers.get(browserId)?.browser
  }

  // 创建新的浏览器上下文
  async createContext(browserId: string, options?: any) {
    const browserInfo = this.browsers.get(browserId)
    if (!browserInfo) {
      throw new Error(`Browser not found: ${browserId}`)
    }

    return await browserInfo.browser.newContext(options)
  }
}