import { expect, test } from '@playwright/test'

test('exports, clears and restores a full backup', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('quick-capture-button').click()
  await page.getByTestId('quick-capture-content').fill('用于备份验收的备忘')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText('备忘已保存')).toBeVisible()

  await page.getByRole('link', { name: '数据与设置' }).click()
  await expect(page.getByRole('heading', { name: '数据与设置' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('export-backup-button').click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()

  await page.getByTestId('clear-all-button').click()
  await page.getByRole('button', { name: /继\s*续/ }).click()
  await page.getByRole('button', { name: '确认清空' }).click()
  await expect(page.getByText('全部数据已清空')).toBeVisible()

  await page.getByTestId('import-backup-input').setInputFiles(downloadPath!)
  await expect(page.getByRole('dialog', { name: '确认恢复备份' })).toBeVisible()
  await page.getByRole('button', { name: /确认恢复/ }).click()
  await expect(page.getByText('备份已恢复')).toBeVisible()

  await page.getByRole('link', { name: '首页' }).click()
  await page.getByTestId('global-search-button').click()
  await page.getByTestId('global-search-input').fill('备份验收')
  await expect(page.getByText('用于备份验收的备忘').first()).toBeVisible()
})
