import { expect, test } from '@playwright/test'

test('plans meals, copies yesterday, records water and syncs with today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '饮食计划' }).click()
  await expect(page.getByRole('heading', { name: '饮食计划' })).toBeVisible()

  await page.getByLabel('前一天').click()
  await page.getByTestId('diet-add-breakfast-input').fill('昨天的燕麦')
  await page.getByTestId('diet-add-breakfast-input').press('Enter')
  await expect(page.getByText('昨天的燕麦')).toBeVisible()

  await page.getByTestId('date-today-link').click()
  await page.getByRole('button', { name: '复制昨天' }).click()
  await expect(page.getByText('昨天的燕麦')).toBeVisible()

  await page.getByTestId('diet-add-breakfast-input').fill('鸡蛋')
  await page.getByTestId('diet-add-breakfast-input').press('Enter')
  await expect(page.getByText('鸡蛋')).toBeVisible()

  await page.getByTestId('diet-favorite-name-input').fill('牛奶')
  await page.getByTestId('diet-favorite-name-input').press('Enter')
  await page.getByRole('button', { name: '牛奶' }).click()
  await expect(
    page.locator('.diet-meal-section').filter({ hasText: '午餐' }).getByText('牛奶'),
  ).toBeVisible()

  await page.getByTestId('diet-add-water').click()
  await page.getByTestId('diet-add-water').click()
  await expect(page.getByTestId('diet-water-text')).toContainText('500')

  await page.getByTestId('diet-join-today').click()
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByText('完成今日饮食记录')).toBeVisible()
  await expect(
    page
      .locator('.plan-row')
      .filter({ hasText: '完成今日饮食记录' })
      .getByText('饮食', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('完成 完成今日饮食记录').click({ force: true })

  await page.getByRole('link', { name: '饮食计划' }).click()
  await expect(page.getByTestId('diet-day-status')).toHaveText('饮食记录已完成')
})
