import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto('http://127.0.0.1:5173/#/plan')

const seeded = await page.evaluate(async () => {
  const { db } = await import('/src/data/db.ts')
  const now = new Date().toISOString()
  const projectId = 'performance-project'
  await db.devProjects.add({
    id: projectId,
    name: '性能抽查项目',
    status: 'active',
    archived: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  })
  const planRows = Array.from({ length: 1000 }, (_, index) => ({
    id: `perf-plan-${index}`,
    date: '2026-10-11',
    kind: 'todo',
    title: `性能测试计划 ${index}`,
    priority: 'medium',
    done: index % 3 === 0,
    sortOrder: index,
    sourceType: 'manual',
    createdAt: now,
    updatedAt: now,
  }))
  const logRows = Array.from({ length: 500 }, (_, index) => ({
    id: `perf-log-${index}`,
    projectId,
    date: '2026-10-11',
    content: `性能测试日志 ${index}`,
    createdAt: now,
    updatedAt: now,
  }))
  await db.planItems.bulkAdd(planRows)
  await db.devLogs.bulkAdd(logRows)
  return { planItems: await db.planItems.count(), devLogs: await db.devLogs.count() }
})

const start = Date.now()
await page.reload()
await page.getByRole('heading', { name: '今日计划' }).waitFor()
const planReady = Date.now() - start
await page.waitForTimeout(1000)
const rowCount = await page.locator('.plan-row').count()
const afterReload = await page.evaluate(async () => {
  const { db } = await import('/src/data/db.ts')
  return {
    count: await db.planItems.count(),
    sample: await db.planItems.limit(2).toArray(),
  }
})
const memory = await page.evaluate(
  () => performance.getEntriesByType('navigation')[0]?.transferSize ?? 0,
)

console.log(
  JSON.stringify(
    {
      seeded,
      planReadyMs: planReady,
      renderedPlanRows: rowCount,
      afterReload,
      navigationTransferBytes: memory,
    },
    null,
    2,
  ),
)

await browser.close()
