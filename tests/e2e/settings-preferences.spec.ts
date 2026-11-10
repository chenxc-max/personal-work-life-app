import { expect, test } from '@playwright/test'

test('home section preferences and default route take effect', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '数据与设置' }).click()

  const mediaCheckbox = page.getByRole('checkbox', { name: '自媒体' })
  await mediaCheckbox.click({ force: true })
  await page.getByRole('link', { name: '首页' }).click()
  await expect(page.getByTestId('summary-media')).toHaveCount(0)

  await page.getByRole('link', { name: '数据与设置' }).click()
  await page.getByRole('checkbox', { name: '自媒体' }).click({ force: true })
  await page.getByTestId('default-route-select').click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今日计划' })).toBeVisible()
})
