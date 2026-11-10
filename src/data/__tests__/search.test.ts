import { db } from '../db'
import { getDataOverview } from '../overview'
import { searchAll } from '../search'
import { consultRepo } from '../repositories/consult'
import { devRepo } from '../repositories/dev'
import { dietRepo } from '../repositories/diet'
import { fitnessRepo } from '../repositories/fitness'
import { gamesRepo } from '../repositories/games'
import { mediaRepo } from '../repositories/media'
import { memoRepo } from '../repositories/memos'
import { planRepo } from '../repositories/plan'
import { todayKey } from '@/utils/date'

describe('global search and data overview', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  it('searches across every first-version module', async () => {
    await memoRepo.create('验收备忘')
    await planRepo.create({
      date: todayKey(),
      kind: 'todo',
      title: '验收计划',
      sourceType: 'manual',
    })
    await mediaRepo.createContent({ title: '验收选题' })
    const project = await devRepo.createProject('验收项目')
    await devRepo.createTask(project.id, '验收开发待办')
    const client = await consultRepo.createClient('验收客户')
    await consultRepo.createFollowUp(client.id, '验收跟进')
    await fitnessRepo.createPlan('验收训练', [new Date().getDay()])
    await dietRepo.addItem(todayKey(), 'breakfast', '验收早餐')
    await gamesRepo.createGame('验收游戏')

    const results = await searchAll('验收')
    const types = new Set(results.map((result) => result.type))
    expect(types.has('memo')).toBe(true)
    expect(types.has('plan')).toBe(true)
    expect(types.has('media')).toBe(true)
    expect(types.has('dev')).toBe(true)
    expect(types.has('client')).toBe(true)
    expect(types.has('consult')).toBe(true)
    expect(types.has('fitness')).toBe(true)
    expect(types.has('diet')).toBe(true)
    expect(types.has('game')).toBe(true)
  })

  it('reports counts and latest update time per module', async () => {
    await memoRepo.create('概览备忘')
    const overview = await getDataOverview()
    const memos = overview.find((item) => item.key === 'memos')
    expect(memos?.count).toBe(1)
    expect(memos?.updatedAt).toBeTruthy()
  })
})
