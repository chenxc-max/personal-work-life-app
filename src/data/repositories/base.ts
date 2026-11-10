import type { EntityTable } from 'dexie'
import type { TimeFields } from '@/domain/types'
import { createId, nowIso } from '@/utils/id'

export function makeEntity<T extends TimeFields>(
  values: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): T {
  const now = nowIso()
  return {
    ...values,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  } as T
}

export function touch<T extends TimeFields>(entity: T): T {
  return { ...entity, updatedAt: nowIso() }
}

export async function nextSortOrder<T extends TimeFields & { sortOrder: number }>(
  table: EntityTable<T, 'id'>,
): Promise<number> {
  const rows = await table.toArray()
  return rows.reduce((highest, row) => Math.max(highest, row.sortOrder), 0) + 1
}
