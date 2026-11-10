import { db } from '../db'
import type { PlanItem, Priority, SourceType } from '@/domain/types'
import { makeEntity, nextSortOrder, touch } from './base'

export type CreatePlanItemInput = {
  date: string
  kind: PlanItem['kind']
  title: string
  note?: string
  priority?: Priority
  startTime?: string
  sourceType?: SourceType
  sourceId?: string
  sourceTitle?: string
}

export const planRepo = {
  async listAll(): Promise<PlanItem[]> {
    return db.planItems.toArray()
  },

  async listByDate(date: string): Promise<PlanItem[]> {
    const rows = await db.planItems.where('date').equals(date).toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async listOpenByDate(date: string): Promise<PlanItem[]> {
    const rows = await db.planItems.where('date').equals(date).toArray()
    return rows.filter((item) => !item.done).sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async listDoneByDate(date: string): Promise<PlanItem[]> {
    const rows = await db.planItems.where('date').equals(date).toArray()
    return rows.filter((item) => item.done).sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async get(id: string): Promise<PlanItem | undefined> {
    return db.planItems.get(id)
  },

  async create(input: CreatePlanItemInput): Promise<PlanItem> {
    const sortOrder = await nextSortOrder<PlanItem>(db.planItems)
    const item = makeEntity<PlanItem>({
      date: input.date,
      kind: input.kind,
      title: input.title,
      note: input.note,
      priority: input.priority ?? 'medium',
      startTime: input.startTime,
      done: false,
      sortOrder,
      sourceType: input.sourceType ?? 'manual',
      sourceId: input.sourceId,
      sourceTitle: input.sourceTitle,
    })
    await db.planItems.add(item)
    return item
  },

  async update(id: string, patch: Partial<PlanItem>): Promise<PlanItem | undefined> {
    const current = await db.planItems.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.planItems.put(next)
    return next
  },

  async remove(id: string): Promise<void> {
    await db.planItems.delete(id)
  },

  async restore(item: PlanItem): Promise<void> {
    await db.planItems.put(item)
  },

  async reorder(date: string, orderedIds: string[]): Promise<void> {
    const rows = await db.planItems.where('date').equals(date).toArray()
    const byId = new Map(rows.map((row) => [row.id, row]))
    await db.transaction('rw', db.planItems, async () => {
      await Promise.all(
        orderedIds.map(async (id, index) => {
          const row = byId.get(id)
          if (!row) return
          await db.planItems.put(touch({ ...row, sortOrder: index }))
        }),
      )
    })
  },

  async getSourceRef(
    sourceType: SourceType,
    sourceId: string,
    date: string,
  ): Promise<PlanItem | undefined> {
    return db.planItems
      .where('[sourceType+sourceId]')
      .equals([sourceType, sourceId])
      .and((item) => item.date === date)
      .first()
  },

  async removeSourceRefs(sourceType: SourceType, sourceId: string): Promise<void> {
    await db.planItems.where('[sourceType+sourceId]').equals([sourceType, sourceId]).delete()
  },

  async rollover(date: string, targetDate: string, ids: string[]): Promise<void> {
    await db.transaction('rw', db.planItems, async () => {
      await Promise.all(
        ids.map(async (id) => {
          const item = await db.planItems.get(id)
          if (!item) return
          await db.planItems.put(
            touch({
              ...item,
              date: targetDate,
              rolledFromDate: date,
              updatedAt: new Date().toISOString(),
            }),
          )
        }),
      )
    })
  },
}
