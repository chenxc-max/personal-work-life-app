import { expect, test } from '@playwright/test'

test('creates a workout plan, checks in and syncs completion with today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '健身计划' }).click()
  await expect(page.getByRole('heading', { name: '健身计划' })).toBeVisible()

  await page.getByTestId('fitness-add-plan-button').click()
  await page.getByTestId('fitness-plan-name-input').fill('上肢训练')
  await page.getByTestId('fitness-exercise-name-0').fill('卧推')
  await page.getByRole('button', { name: '创建计划' }).click()
  await expect(page.getByText('上肢训练').first()).toBeVisible()

  await page.getByRole('button', { name: /开始训练/ }).click()
  await expect(page.getByText('今日训练已开始，并加入今日计划')).toBeVisible()

  const firstSet = page.locator('.workout-set').first()
  await firstSet.locator('input[type="checkbox"]').click()
  await firstSet.getByRole('spinbutton', { name: /第1组实际次数/ }).fill('10')
  await firstSet.getByRole('spinbutton', { name: /第1组实际重量/ }).fill('60')
  await page.getByRole('button', { name: '完成训练' }).click()
  await expect(page.getByText('训练已完成并写入历史')).toBeVisible()

  await page.getByRole('link', { name: '今日计划' }).click()
  await page.getByRole('button', { name: /已完成/ }).click()
  await expect(page.getByText('完成训练：上肢训练')).toBeVisible()
  await expect(
    page
      .locator('.plan-row')
      .filter({ hasText: '完成训练：上肢训练' })
      .getByText('健身', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('完成 完成训练：上肢训练').click({ force: true })

  await page.getByRole('link', { name: '健身计划' }).click()
  await page.getByRole('button', { name: '记录身体数据' }).click()
  await page.getByTestId('fitness-weight-input').fill('72.5')
  await page.getByRole('button', { name: '记录数据' }).click()
  await expect(page.getByText('身体数据已记录')).toBeVisible()
  await expect(page.locator('.recharts-line')).toBeVisible()
})
