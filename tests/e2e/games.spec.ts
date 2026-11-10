import { expect, test } from '@playwright/test'

test('manages games, accumulates play time and keeps an entertainment list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '游戏娱乐' }).click()
  await expect(page.getByRole('heading', { name: '游戏娱乐' })).toBeVisible()

  await page.getByTestId('games-add-game-button').click()
  await page.getByTestId('games-name-input').fill('塞尔达传说')
  await page.getByPlaceholder('例如 Switch').fill('Switch')
  await page.getByRole('dialog').getByRole('button', { name: '添加游戏' }).click()
  await expect(page.getByText('塞尔达传说').first()).toBeVisible()

  const gameCard = page.locator('.game-card').filter({ hasText: '塞尔达传说' })
  await gameCard.getByRole('button', { name: '记录游玩' }).click()
  await page.getByTestId('games-play-minutes-input').fill('90')
  await page.getByRole('button', { name: '保存时长' }).click()
  await expect(page.locator('.ant-modal-mask')).toBeHidden()
  await expect(gameCard.getByText('1 小时 30 分钟')).toBeVisible()

  await gameCard.getByRole('button', { name: '记录游玩' }).click()
  await page.getByTestId('games-play-minutes-input').fill('30')
  await page.getByRole('button', { name: '保存时长' }).click()
  await expect(page.locator('.ant-modal-mask')).toBeHidden()
  await expect(gameCard.getByText('2 小时')).toBeVisible()

  await gameCard.locator('.ant-select').click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await gameCard.getByRole('button', { name: '编辑 塞尔达传说' }).click()
  await page.locator('.ant-rate-star').nth(4).click()
  await page.getByRole('button', { name: '保存修改' }).click()
  await expect(gameCard.getByText('5 分')).toBeVisible()

  await page.getByRole('button', { name: '添加娱乐' }).click()
  await page.getByTestId('entertainment-name-input').fill('一部值得看的电影')
  await page.getByRole('dialog').getByRole('button', { name: '添加娱乐' }).click()
  await expect(page.getByText('一部值得看的电影')).toBeVisible()

  await page.reload()
  await expect(page.getByText('塞尔达传说').first()).toBeVisible()
  await expect(page.getByText('2 小时')).toBeVisible()
  await expect(page.getByText('一部值得看的电影')).toBeVisible()
})
