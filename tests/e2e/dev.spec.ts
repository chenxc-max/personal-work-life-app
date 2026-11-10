import { expect, test } from '@playwright/test'

test('manages a development project and syncs a task with today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: '开发工作' }).click()
  await expect(page.getByRole('heading', { name: '开发工作' })).toBeVisible()

  await page.getByTestId('dev-add-project-button').click()
  await page.getByTestId('dev-project-name-input').fill('个人效率项目')
  await page.getByRole('button', { name: '创建项目' }).click()
  await expect(
    page.getByRole('heading', { name: '个人效率项目', exact: true }),
  ).toBeVisible()

  await page.getByTestId('dev-add-task-button').click()
  await page.getByTestId('dev-task-title-input').fill('完成开发模块接口')
  await page.getByRole('button', { name: '添加待办' }).click()
  await expect(page.getByText('完成开发模块接口')).toBeVisible()

  await page.getByRole('tab', { name: /Bug/ }).click()
  await page.getByTestId('dev-add-bug-button').click()
  await page.getByTestId('dev-bug-title-input').fill('首页统计数字偶尔闪烁')
  await page.getByRole('button', { name: /添加\s*Bug/ }).click()
  await expect(page.getByText('首页统计数字偶尔闪烁')).toBeVisible()

  await page.getByRole('tab', { name: /日志/ }).click()
  await page.getByRole('button', { name: '新增日志' }).click()
  await page.getByTestId('dev-log-content-input').fill('完成今日开发记录')
  await page.getByRole('button', { name: '记录日志' }).click()
  await expect(page.getByText('完成今日开发记录')).toBeVisible()

  await page.getByRole('tab', { name: /里程碑/ }).click()
  await page.getByRole('button', { name: '新增里程碑' }).click()
  await page.getByTestId('dev-milestone-name-input').fill('发布第一版')
  await page.getByRole('button', { name: '添加里程碑' }).click()
  await expect(page.getByText('发布第一版')).toBeVisible()

  await page.getByRole('tab', { name: /待办/ }).click()
  const taskRow = page.locator('.ant-list-item').filter({
    hasText: '完成开发模块接口',
  })
  await taskRow.getByRole('button', { name: '今日' }).click()
  await expect(page.getByText('已加入今日计划')).toBeVisible()

  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByText('完成开发模块接口')).toBeVisible()
  await expect(
    page
      .locator('.plan-row')
      .filter({ hasText: '完成开发模块接口' })
      .getByText('开发', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('完成 完成开发模块接口').click({ force: true })

  await page.getByRole('link', { name: '开发工作' }).click()
  const completedTaskRow = page.locator('.ant-list-item').filter({
    hasText: '完成开发模块接口',
  })
  await expect(completedTaskRow.locator('input[type="checkbox"]')).toBeChecked()
})
