import { db } from '../db'
import type { EntertainmentItem, Game, GameStatus, PlayLog } from '@/domain/types'
import { makeEntity, nextSortOrder, touch } from './base'

export const gamesRepo = {
  async listGames(): Promise<Game[]> {
    const rows = await db.games.toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createGame(name: string, platform?: string): Promise<Game> {
    const game = makeEntity<Game>({
      name,
      platform,
      status: 'wishlist',
      totalMinutes: 0,
      sortOrder: await nextSortOrder<Game>(db.games),
    })
    await db.games.add(game)
    return game
  },

  async updateGame(id: string, patch: Partial<Game>): Promise<Game | undefined> {
    const current = await db.games.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.games.put(next)
    return next
  },

  async removeGame(id: string): Promise<void> {
    await db.transaction('rw', [db.games, db.playLogs], async () => {
      await Promise.all([db.games.delete(id), db.playLogs.where('gameId').equals(id).delete()])
    })
  },

  async listPlayLogs(gameId: string): Promise<PlayLog[]> {
    const rows = await db.playLogs.where('gameId').equals(gameId).toArray()
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  },

  async recordPlay(gameId: string, date: string, minutes: number, note?: string): Promise<PlayLog> {
    const game = await db.games.get(gameId)
    if (!game) throw new Error('游戏不存在')
    const log = makeEntity<PlayLog>({ gameId, date, minutes, note })
    await db.transaction('rw', [db.playLogs, db.games], async () => {
      await db.playLogs.add(log)
      await db.games.put(touch({ ...game, totalMinutes: game.totalMinutes + minutes }))
    })
    return log
  },

  async setStatus(id: string, status: GameStatus): Promise<void> {
    await this.updateGame(id, { status })
  },

  async listEntertainment(): Promise<EntertainmentItem[]> {
    const rows = await db.entertainmentItems.toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createEntertainment(
    name: string,
    type: EntertainmentItem['type'],
  ): Promise<EntertainmentItem> {
    const item = makeEntity<EntertainmentItem>({
      name,
      type,
      status: 'wishlist',
      sortOrder: await nextSortOrder<EntertainmentItem>(db.entertainmentItems),
    })
    await db.entertainmentItems.add(item)
    return item
  },

  async updateEntertainment(
    id: string,
    patch: Partial<EntertainmentItem>,
  ): Promise<EntertainmentItem | undefined> {
    const current = await db.entertainmentItems.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.entertainmentItems.put(next)
    return next
  },

  async removeEntertainment(id: string): Promise<void> {
    await db.entertainmentItems.delete(id)
  },
}
