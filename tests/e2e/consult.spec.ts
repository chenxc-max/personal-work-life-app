import { expect, test } from '@playwright/test'

test('records a consultation, creates follow-up and syncs it with today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '咨询工作' }).click()
  await expect(page.getByRole('heading', { name: '咨询工作' })).toBeVisible()

  await page.getByTestId('consult-add-client-button').click()
  await page.getByTestId('consult-client-name-input').fill('李女士')
  await page.getByRole('button', { name: '创建客户' }).click()
  await expect(
    page.locator('h2').filter({ hasText: '李女士' }),
  ).toBeVisible()

  await page.getByRole('button', { name: '记录咨询' }).click()
  await page.getByTestId('consult-session-topic-input').fill('首次需求沟通')
  await page.getByTestId('consult-session-next-step-input').fill('下周发送执行方案')
  await page.getByRole('button', { name: '保存记录' }).click()
  await expect(page.getByText('首次需求沟通')).toBeVisible()

  await page.getByRole('tab', { name: /跟进待办/ }).click()
  const followUpRow = page.locator('.ant-list-item').filter({
    hasText: '下周发送执行方案',
  }).filter({
    has: page.getByRole('button', { name: '今日' }),
  })
  await expect(followUpRow).toBeVisible()
  await followUpRow.getByRole('button', { name: '今日' }).click()
  await expect(page.getByText('已加入今日计划')).toBeVisible()

  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(
    page
      .locator('.plan-row')
      .filter({ hasText: '下周发送执行方案' })
      .getByText('下周发送执行方案', { exact: true }),
  ).toBeVisible()
  await expect(
    page
      .locator('.plan-row')
      .filter({ hasText: '下周发送执行方案' })
      .getByText('咨询', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('完成 下周发送执行方案').click({ force: true })

  await page.getByRole('link', { name: '咨询工作' }).click()
  await page.getByRole('tab', { name: /跟进待办/ }).click()
  await expect(
    page.locator('.ant-list-item').filter({ hasText: '下周发送执行方案' }).locator('input[type="checkbox"]'),
  ).toBeChecked()

  await page.getByRole('tab', { name: /结算记录/ }).click()
  await page.getByRole('button', { name: '新增结算' }).click()
  await page.getByRole('spinbutton', { name: '金额' }).fill('800')
  await page.getByRole('button', { name: '添加结算' }).click()
  await expect(page.locator('.ant-list-item').filter({ hasText: '800' })).toBeVisible()
})
