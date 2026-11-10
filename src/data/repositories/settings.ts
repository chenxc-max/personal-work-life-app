import { db } from '../db'
import { DEFAULT_HOME_SECTIONS, DEFAULT_ROUTE, DEFAULT_WATER_GOAL_ML } from '@/domain/constants'
import type { AppSettings } from '@/domain/types'
import { nowIso } from '@/utils/id'

export function createDefaultSettings(): AppSettings {
  const now = nowIso()
  return {
    id: 'app',
    defaultRoute: DEFAULT_ROUTE,
    homeSections: DEFAULT_HOME_SECTIONS,
    waterGoalMl: DEFAULT_WATER_GOAL_ML,
    createdAt: now,
    updatedAt: now,
  } as AppSettings
}

export const settingsRepo = {
  async get(): Promise<AppSettings> {
    const existing = await db.settings.get('app')
    if (existing) return existing
    return createDefaultSettings()
  },

  async ensure(): Promise<AppSettings> {
    const existing = await db.settings.get('app')
    if (existing) return existing
    const defaults = createDefaultSettings()
    await db.settings.put(defaults)
    return defaults
  },

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get()
    const next = { ...current, ...patch, id: 'app' as const, updatedAt: nowIso() }
    await db.settings.put(next)
    return next
  },

  async reset(): Promise<AppSettings> {
    const defaults = createDefaultSettings()
    await db.settings.put(defaults)
    return defaults
  },
}
