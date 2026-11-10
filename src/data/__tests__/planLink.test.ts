import { db } from '../db'
import {
  addDevTaskToToday,
  addToToday,
  convertMemo,
  deleteSource,
  setPlanItemDone,
  syncSourceToPlan,
} from '../planLink'
import { devRepo } from '../repositories/dev'
import { memoRepo } from '../repositories/memos'
import { todayKey } from '@/utils/date'

describe('cross-module plan links', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  it('adds a source item to today without creating duplicates', async () => {
    const project = await devRepo.createProject('测试项目')
    const task = await devRepo.createTask(project.id, '修复首页问题', 'high')

    const first = await addDevTaskToToday(task.id, task.title)
    const second = await addDevTaskToToday(task.id, task.title)

    expect(first.id).toBe(second.id)
    expect(first.sourceType).toBe('dev')
    expect(first.sourceId).toBe(task.id)
    expect(first.date).toBe(todayKey())
  })

  it('syncs completion from today back to the source', async () => {
    const project = await devRepo.createProject('测试项目')
    const task = await devRepo.createTask(project.id, '发布版本')
    const planItem = await addDevTaskToToday(task.id, task.title)

    await setPlanItemDone(planItem.id, true)

    const completedTask = await db.devTasks.get(task.id)
    const completedPlanItem = await db.planItems.get(planItem.id)
    expect(completedTask?.status).toBe('done')
    expect(completedPlanItem?.done).toBe(true)
  })

  it('syncs completion from the source back to today', async () => {
    const project = await devRepo.createProject('测试项目')
    const task = await devRepo.createTask(project.id, '完成接口')
    const planItem = await addDevTaskToToday(task.id, task.title)

    await devRepo.setTaskDone(task.id, true)
    await syncSourceToPlan('dev', task.id, true)

    expect((await db.planItems.get(planItem.id))?.done).toBe(true)
  })

  it('removes today references when the source is deleted', async () => {
    const project = await devRepo.createProject('测试项目')
    const task = await devRepo.createTask(project.id, '临时任务')
    await addDevTaskToToday(task.id, task.title)

    await deleteSource('dev', task.id)

    expect(await db.devTasks.get(task.id)).toBeUndefined()
    expect(await db.planItems.where('sourceId').equals(task.id).count()).toBe(0)
  })

  it('marks a memo as converted', async () => {
    const memo = await memoRepo.create('写一篇关于本机应用的文章')
    await convertMemo(memo.id, 'media', 'content-1', '自媒体选题')

    const converted = await db.memos.get(memo.id)
    expect(converted?.status).toBe('converted')
    expect(converted?.convertedToType).toBe('media')
    expect(converted?.convertedToId).toBe('content-1')
  })

  it('keeps the manual source intact when no handler exists', async () => {
    const planItem = await addToToday('game', 'game-1', {
      title: '娱乐测试',
      sourceTitle: '娱乐',
    })

    await setPlanItemDone(planItem.id, true)
    expect((await db.planItems.get(planItem.id))?.done).toBe(true)
  })
})
