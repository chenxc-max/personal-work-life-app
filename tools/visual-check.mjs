import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const root = resolve('.')
const outputDir = join(root, 'test-results', 'p11-visual')
mkdirSync(outputDir, { recursive: true })

const viewports = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

const routes = [
  ['home', '/#/home'],
  ['plan', '/#/plan'],
  ['media', '/#/media'],
  ['dev', '/#/dev'],
  ['consult', '/#/consult'],
  ['fitness', '/#/fitness'],
  ['diet', '/#/diet'],
  ['games', '/#/games'],
  ['settings', '/#/settings'],
]

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport })
  for (const [name, hash] of routes) {
    await page.goto(`http://127.0.0.1:5173${hash}`)
    await page.waitForTimeout(350)
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }))
    await page.screenshot({
      path: join(outputDir, `${viewport.width}x${viewport.height}-${name}.png`),
      fullPage: true,
    })
    results.push({
      viewport: `${viewport.width}x${viewport.height}`,
      route: name,
      horizontalOverflow: layout.scrollWidth > layout.clientWidth,
      verticalOverflow: layout.scrollHeight > layout.clientHeight,
    })
  }
  await page.close()
}

await browser.close()
console.table(results)
console.log(`截图目录：${outputDir}`)
