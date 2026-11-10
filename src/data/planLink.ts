import { db } from './db'
import { consultRepo } from './repositories/consult'
import { devRepo } from './repositories/dev'
import { dietRepo } from './repositories/diet'
import { fitnessRepo } from './repositories/fitness'
import { mediaRepo } from './repositories/media'
import { memoRepo } from './repositories/memos'
import { planRepo, type CreatePlanItemInput } from './repositories/plan'
import type { PlanItem, SourceType } from '@/domain/types'
import { todayKey } from '@/utils/date'
import { nowIso } from '@/utils/id'

type SourceDoneHandler = (sourceId: string, done: boolean) => Promise<void>

const sourceDoneHandlers: Partial<Record<SourceType, SourceDoneHandler>> = {
  dev: (sourceId, done) => devRepo.setTaskDone(sourceId, done),
  consult: (sourceId, done) => consultRepo.setFollowUpDone(sourceId, done),
  media: (sourceId, done) => mediaRepo.markContentDone(sourceId, done),
  fitness: (sourceId, done) => fitnessRepo.setSessionDone(sourceId, done),
  diet: (sourceId, done) => dietRepo.setDayDone(sourceId, done),
}

export async function addToToday(
  sourceType: Exclude<SourceType, 'manual'>,
  sourceId: string,
  options: {
    title: string
    note?: string
    priority?: PlanItem['priority']
    startTime?: string
    sourceTitle?: string
    date?: string
  },
): Promise<PlanItem> {
  const date = options.date ?? todayKey()
  const existing = await planRepo.getSourceRef(sourceType, sourceId, date)
  if (existing) return existing

  return planRepo.create({
    date,
    kind: 'todo',
    title: options.title,
    note: options.note,
    priority: options.priority ?? 'medium',
    startTime: options.startTime,
    sourceType,
    sourceId,
    sourceTitle: options.sourceTitle,
  })
}

export async function createManualPlanItem(
  input: Omit<CreatePlanItemInput, 'sourceType' | 'sourceId' | 'sourceTitle'>,
): Promise<PlanItem> {
  return planRepo.create({ ...input, sourceType: 'manual' })
}

export async function setPlanItemDone(id: string, done: boolean): Promise<void> {
  const item = await planRepo.get(id)
  if (!item) return

  await planRepo.update(id, {
    done,
    doneAt: done ? nowIso() : undefined,
  })

  if (item.sourceType !== 'manual' && item.sourceId) {
    await sourceDoneHandlers[item.sourceType]?.(item.sourceId, done)
  }
}

export async function syncSourceToPlan(
  sourceType: SourceType,
  sourceId: string,
  done: boolean,
): Promise<void> {
  const refs = await db.planItems
    .where('[sourceType+sourceId]')
    .equals([sourceType, sourceId])
    .toArray()

  const matching = refs.filter((item) => (done ? !item.done : item.done))
  await Promise.all(
    matching.map((item) =>
      planRepo.update(item.id, {
        done,
        doneAt: done ? nowIso() : undefined,
      }),
    ),
  )
}

export async function deleteSource(sourceType: Exclude<SourceType, 'manual'>, sourceId: string) {
  switch (sourceType) {
    case 'media':
      await mediaRepo.removeContent(sourceId)
      break
    case 'dev':
      await devRepo.removeTask(sourceId)
      break
    case 'consult':
      await consultRepo.removeFollowUp(sourceId)
      break
    case 'fitness':
      await fitnessRepo.updateSession(sourceId, { done: false })
      break
    case 'diet':
      break
    case 'game':
      break
  }
  await planRepo.removeSourceRefs(sourceType, sourceId)
}

export async function convertMemo(
  memoId: string,
  targetType: SourceType | 'memo',
  targetId: string,
  label: string,
): Promise<void> {
  await memoRepo.update(memoId, {
    status: 'converted',
    convertedToType: targetType === 'memo' ? undefined : targetType,
    convertedToId: targetId,
    convertedLabel: label,
  })
}

export async function addDevTaskToToday(taskId: string, title: string): Promise<PlanItem> {
  return addToToday('dev', taskId, { title, sourceTitle: '开发待办' })
}

export async function addMediaToToday(contentId: string, title: string): Promise<PlanItem> {
  return addToToday('media', contentId, { title, sourceTitle: '发布内容' })
}

export async function addConsultToToday(followUpId: string, title: string): Promise<PlanItem> {
  return addToToday('consult', followUpId, { title, sourceTitle: '客户跟进' })
}

export async function addFitnessToToday(sessionId: string, title: string): Promise<PlanItem> {
  return addToToday('fitness', sessionId, { title, sourceTitle: '训练打卡' })
}

export async function addDietToToday(date: string, title = '完成今日饮食记录'): Promise<PlanItem> {
  return addToToday('diet', date, { title, sourceTitle: '饮食记录' })
}
