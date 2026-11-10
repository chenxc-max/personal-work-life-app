import { expect, test } from '@playwright/test'

test('moves a content item through the media workflow and syncs with today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '自媒体' }).click()
  await expect(page.getByRole('heading', { name: '自媒体' })).toBeVisible()

  await page.getByTestId('media-add-idea-input').fill('第一期个人效率内容')
  await page.getByTestId('media-add-idea-input').press('Enter')
  await expect(page.getByText('第一期个人效率内容')).toBeVisible()

  await page.getByText('第一期个人效率内容').click()
  const planDate = page.getByRole('textbox', { name: '计划发布日' })
  await planDate.click()
  await planDate.fill('2026-10-11')
  await planDate.press('Enter')
  await page.getByTestId('media-save-content').click()
  await expect(page.getByText('内容已保存').last()).toBeVisible()
  await expect(page.getByRole('dialog').filter({ hasText: '第一期个人效率内容' })).toBeHidden()
  await expect(page.locator('.ant-drawer-mask')).toBeHidden()

  const card = page.locator('[data-testid^="media-card-"]').filter({
    hasText: '第一期个人效率内容',
  })
  const source = card.locator('[aria-label="拖动内容卡片"]')
  const target = page.getByTestId('media-column-ready').locator('.media-column-list')
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  expect(sourceBox).toBeTruthy()
  expect(targetBox).toBeTruthy()
  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
    steps: 24,
  })
  await page.waitForTimeout(250)
  await page.mouse.up()
  await expect(
    page.getByTestId('media-column-ready').getByText('第一期个人效率内容'),
  ).toBeVisible()

  await page.getByText('第一期个人效率内容').click()
  await page.getByTestId('media-join-today').click()
  await expect(page.getByText('已加入今日计划')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.ant-drawer-mask')).toBeHidden()

  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByText('发布：第一期个人效率内容')).toBeVisible()
  await expect(
    page.locator('.plan-row').filter({ hasText: '发布：第一期个人效率内容' }).getByText('自媒体'),
  ).toBeVisible()
  await page.getByLabel('完成 发布：第一期个人效率内容').click({ force: true })

  await page.getByRole('link', { name: '自媒体' }).click()
  await expect(
    page.getByTestId('media-column-published').getByText('第一期个人效率内容'),
  ).toBeVisible()

  await page.getByText('第一期个人效率内容').click()
  const viewsInput = page.getByRole('spinbutton', { name: '播放' })
  await viewsInput.fill('1280')
  await page.getByTestId('media-save-content').click()
  await expect(page.getByText('内容已保存').last()).toBeVisible()
  await page.reload()
  await page.getByText('第一期个人效率内容').click()
  await expect(page.getByRole('spinbutton', { name: '播放' })).toHaveValue('1280')
})
