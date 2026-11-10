import { expect, test } from '@playwright/test'

const captures = [
  { type: '备忘', text: '快速记录验证内容' },
  { type: '今日任务', text: '快速任务验证' },
  { type: '自媒体选题', text: '快速选题验证' },
  { type: '开发待办', text: '快速开发验证' },
  { type: '咨询跟进', text: '快速跟进验证' },
  { type: '训练计划', text: '快速训练验证' },
  { type: '饮食记录', text: '快速加餐验证' },
  { type: '游戏', text: '快速游戏验证' },
] as const

test('quick capture saves all types and global search finds them', async ({ page }) => {
  await page.goto('/')

  for (const capture of captures) {
    await page.getByTestId('quick-capture-button').click()
    await page.locator('.ant-segmented-item').filter({ hasText: capture.type }).click()
    await page.getByTestId('quick-capture-content').fill(capture.text)
    await page.getByRole('button', { name: /保\s*存/ }).click()
    await expect(page.getByRole('dialog', { name: '快速记录' })).toBeHidden()
  }

  await page.getByTestId('global-search-button').click()
  await page.getByTestId('global-search-input').fill('快速')

  for (const capture of captures) {
    await expect(page.getByText(capture.text).first()).toBeVisible()
  }
})
