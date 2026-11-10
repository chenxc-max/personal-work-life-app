import { chromium, expect, test } from '@playwright/test'

test('data persists across reloads and a complete browser restart', async ({ page: _page }, testInfo) => {
  void _page
  const userDataDir = testInfo.outputPath('persistent-profile')
  const contextOptions = {
    channel: 'msedge' as const,
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  }

  const firstContext = await chromium.launchPersistentContext(userDataDir, contextOptions)
  const firstPage = firstContext.pages()[0] ?? (await firstContext.newPage())
  await firstPage.goto('http://127.0.0.1:5173/#/plan')

  await firstPage.getByTestId('plan-add-button').click()
  await firstPage.getByTestId('plan-title-input').fill('重启后仍然存在的计划')
  await firstPage.getByRole('button', { name: '添加计划' }).click()
  await expect(firstPage.getByText('重启后仍然存在的计划')).toBeVisible()
  await firstPage.reload()
  await expect(firstPage.getByText('重启后仍然存在的计划')).toBeVisible()
  await firstContext.close()

  const secondContext = await chromium.launchPersistentContext(userDataDir, contextOptions)
  const secondPage = secondContext.pages()[0] ?? (await secondContext.newPage())
  await secondPage.goto('http://127.0.0.1:5173/#/plan')
  await expect(secondPage.getByText('重启后仍然存在的计划')).toBeVisible()
  await secondContext.close()
})
