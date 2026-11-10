import { expect, test } from '@playwright/test'

async function addPlan(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('link', { name: '今日计划' }).click()
  await page.getByTestId('plan-add-button').click()
  await page.getByTestId('plan-title-input').fill(title)
  await page.getByRole('button', { name: '添加计划' }).click()
  await expect(page.getByText(title)).toBeVisible()
}

test('creates a plan, shows it on home and syncs completion', async ({ page }) => {
  await page.goto('/')
  await addPlan(page, '写本周开发总结')

  await page.getByRole('link', { name: '首页' }).click()
  await expect(page.getByText('写本周开发总结')).toBeVisible()
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible()

  await page.getByLabel('完成 写本周开发总结').click({ force: true })

  await page.getByRole('link', { name: '今日计划' }).click()
  await page.getByText('已完成').click()
  await expect(page.getByLabel('完成 写本周开发总结')).toBeChecked()
})

test('captures a memo and converts it into a today task', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('quick-memo-input').fill('给自媒体模块补充选题')
  await page.getByTestId('quick-memo-input').press('Enter')
  await expect(page.getByText('给自媒体模块补充选题')).toBeVisible()

  await page.getByRole('button', { name: '归类' }).click()
  await page.getByRole('button', { name: '确认转换' }).click()
  await expect(page.getByText('已转为今日任务')).toBeVisible()

  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByText('给自媒体模块补充选题')).toBeVisible()
})

test('rolls an unfinished past plan over to the next day', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '今日计划' }).click()
  await page.getByLabel('前一天').click()

  await page.getByTestId('plan-add-button').click()
  await page.getByTestId('plan-title-input').fill('昨天遗留事项')
  await page.getByRole('button', { name: '添加计划' }).click()
  await expect(page.getByText('昨天遗留事项')).toBeVisible()

  await page.getByRole('button', { name: '处理未完成事项' }).click()
  await page.getByRole('checkbox', { name: '昨天遗留事项', exact: true }).check()
  await page.getByRole('button', { name: '顺延到明天' }).click()
  await expect(page.getByRole('dialog', { name: '处理未完成事项' })).toBeHidden()

  await page.getByTestId('date-today-link').click()
  await expect(
    page.locator('.plan-row-title').filter({ hasText: '昨天遗留事项' }),
  ).toBeVisible()
})

test('supports undo for a single plan deletion and warns about unsaved edits', async ({ page }) => {
  await page.goto('/')
  await addPlan(page, '需要撤销删除的计划')

  const row = page.locator('.plan-row').filter({ hasText: '需要撤销删除的计划' })
  await row.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: /确\s*定/ }).click()
  await expect(page.getByTestId('undo-toast')).toContainText('需要撤销删除的计划')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.getByText('需要撤销删除的计划')).toBeVisible()

  await page.getByTestId('plan-add-button').click()
  await page.getByTestId('plan-title-input').fill('未保存的计划')
  await page.getByRole('button', { name: /取\s*消/ }).click()
  await expect(
    page.locator('.ant-modal-confirm-title').filter({ hasText: '放弃未保存的修改？' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '放弃修改' }).click()
  await expect(page.getByText('未保存的计划')).toHaveCount(0)
})
