import { db } from '../db'
import type { MediaAccount, MediaContent, MediaStatus } from '@/domain/types'
import { makeEntity, nextSortOrder, touch } from './base'
import { nowIso } from '@/utils/id'

export type CreateMediaAccountInput = Pick<MediaAccount, 'name' | 'note'>
export type CreateMediaContentInput = {
  title: string
  idea?: string
  draft?: string
  accountId?: string
  platform?: string
  status?: MediaStatus
}

export const mediaRepo = {
  async listAccounts(): Promise<MediaAccount[]> {
    const rows = await db.mediaAccounts.toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createAccount(input: CreateMediaAccountInput): Promise<MediaAccount> {
    const account = makeEntity<MediaAccount>({
      ...input,
      sortOrder: await nextSortOrder<MediaAccount>(db.mediaAccounts),
    })
    await db.mediaAccounts.add(account)
    return account
  },

  async updateAccount(id: string, patch: Partial<MediaAccount>): Promise<MediaAccount | undefined> {
    const current = await db.mediaAccounts.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.mediaAccounts.put(next)
    return next
  },

  async removeAccount(id: string): Promise<void> {
    await db.mediaAccounts.delete(id)
  },

  async listContents(): Promise<MediaContent[]> {
    const rows = await db.mediaContents.toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async listByStatus(status: MediaStatus): Promise<MediaContent[]> {
    const rows = await db.mediaContents.where('status').equals(status).toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createContent(input: CreateMediaContentInput): Promise<MediaContent> {
    const content = makeEntity<MediaContent>({
      title: input.title,
      idea: input.idea,
      draft: input.draft,
      accountId: input.accountId,
      platform: input.platform,
      status: input.status ?? 'idea',
      metrics: {},
      sortOrder: await nextSortOrder<MediaContent>(db.mediaContents),
    })
    await db.mediaContents.add(content)
    return content
  },

  async updateContent(
    id: string,
    patch: Partial<MediaContent>,
  ): Promise<MediaContent | undefined> {
    const current = await db.mediaContents.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.mediaContents.put(next)
    return next
  },

  async removeContent(id: string): Promise<void> {
    await db.mediaContents.delete(id)
  },

  async moveContent(id: string, status: MediaStatus): Promise<MediaContent | undefined> {
    const content = await this.updateContent(id, { status, sortOrder: 0 })
    if (!content) return undefined
    const siblings = await db.mediaContents.where('status').equals(status).toArray()
    const nextOrder = siblings.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1
    return this.updateContent(id, { sortOrder: nextOrder })
  },

  async publishContent(id: string, publishedAt = nowIso()): Promise<MediaContent | undefined> {
    return this.updateContent(id, { status: 'published', publishedAt })
  },

  async markContentDone(id: string, done: boolean): Promise<void> {
    await this.updateContent(id, {
      status: done ? 'published' : 'ready',
      publishedAt: done ? nowIso() : undefined,
    })
  },
}
