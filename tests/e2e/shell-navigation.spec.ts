import { expect, test } from '@playwright/test'

const routes = [
  ['首页', '/home', '首页总览'],
  ['今日计划', '/plan', '今日计划'],
  ['自媒体', '/media', '自媒体'],
  ['开发工作', '/dev', '开发工作'],
  ['咨询工作', '/consult', '咨询工作'],
  ['健身计划', '/fitness', '健身计划'],
  ['饮食计划', '/diet', '饮食计划'],
  ['游戏娱乐', '/games', '游戏娱乐'],
  ['数据与设置', '/settings', '数据与设置'],
] as const

test('navigates through all nine modules', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '首页总览' })).toBeVisible()

  for (const [label, , heading] of routes.slice(1)) {
    await page.getByRole('link', { name: label }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})

test('has no horizontal overflow at desktop widths', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '首页总览' })).toBeVisible()

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
})

test('does not request any external network resource', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname !== '127.0.0.1') externalRequests.push(request.url())
  })

  await page.goto('/')
  for (const [label] of routes) {
    await page.getByRole('link', { name: label }).click()
  }
  expect(externalRequests).toEqual([])
})
