import { db } from './db'

export interface ModuleOverview {
  key: string
  label: string
  count: number
  updatedAt?: string
}

const MODULES = [
  { key: 'memos', label: '快速备忘', tables: ['memos'] },
  { key: 'plan', label: '今日计划', tables: ['planItems'] },
  { key: 'media', label: '自媒体', tables: ['mediaAccounts', 'mediaContents'] },
  {
    key: 'dev',
    label: '开发工作',
    tables: ['devProjects', 'devTasks', 'devBugs', 'devLogs', 'devMilestones'],
  },
  {
    key: 'consult',
    label: '咨询工作',
    tables: ['clients', 'consultSessions', 'consultFollowUps', 'consultSettlements'],
  },
  {
    key: 'fitness',
    label: '健身计划',
    tables: ['workoutPlans', 'workoutSessions', 'bodyMetrics'],
  },
  {
    key: 'diet',
    label: '饮食计划',
    tables: ['mealDays', 'mealItems', 'mealFavorites'],
  },
  {
    key: 'games',
    label: '游戏娱乐',
    tables: ['games', 'playLogs', 'entertainmentItems'],
  },
] as const

export async function getDataOverview(): Promise<ModuleOverview[]> {
  const overview: ModuleOverview[] = []
  for (const module of MODULES) {
    let count = 0
    let updatedAt: string | undefined
    for (const tableName of module.tables) {
      const table = db.table(tableName)
      count += await table.count()
      const rows = await table.toArray()
      for (const row of rows) {
        const value = (row as { updatedAt?: string }).updatedAt
        if (value && (!updatedAt || value > updatedAt)) updatedAt = value
      }
    }
    overview.push({
      key: module.key,
      label: module.label,
      count,
      updatedAt,
    })
  }
  return overview
}
