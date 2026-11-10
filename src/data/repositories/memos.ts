import { db } from '../db'
import type { Memo } from '@/domain/types'
import { makeEntity, touch } from './base'

export const memoRepo = {
  async list(limit = 30): Promise<Memo[]> {
    return db.memos.orderBy('createdAt').reverse().limit(limit).toArray()
  },

  async listInbox(): Promise<Memo[]> {
    return db.memos.where('status').equals('inbox').reverse().sortBy('createdAt')
  },

  async create(content: string): Promise<Memo> {
    const memo = makeEntity<Memo>({
      content,
      status: 'inbox',
    })
    await db.memos.add(memo)
    return memo
  },

  async update(id: string, patch: Partial<Memo>): Promise<Memo | undefined> {
    const current = await db.memos.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.memos.put(next)
    return next
  },

  async remove(id: string): Promise<void> {
    await db.memos.delete(id)
  },
}
