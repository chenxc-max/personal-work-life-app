import { z } from 'zod'
import { db } from './db'
import { settingsRepo } from './repositories/settings'
import type { AppSettings, BackupFile, BackupPayload, BackupRecord } from '@/domain/types'
import { createId, nowIso } from '@/utils/id'

export const BACKUP_APP_ID = 'personal-work-life-app'
export const BACKUP_SCHEMA_VERSION = 1

export const BUSINESS_TABLE_NAMES = [
  'settings',
  'memos',
  'planItems',
  'mediaAccounts',
  'mediaContents',
  'devProjects',
  'devTasks',
  'devBugs',
  'devLogs',
  'devMilestones',
  'clients',
  'consultSessions',
  'consultFollowUps',
  'consultSettlements',
  'workoutPlans',
  'workoutSessions',
  'bodyMetrics',
  'mealDays',
  'mealItems',
  'mealFavorites',
  'games',
  'playLogs',
  'entertainmentItems',
] as const

const recordSchema = z.object({ id: z.string() }).passthrough()

export const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(recordSchema)),
  settings: z.object({ id: z.literal('app') }).passthrough().nullable(),
})

async function buildPayload(): Promise<BackupPayload> {
  const tables: BackupPayload['tables'] = {}
  for (const tableName of BUSINESS_TABLE_NAMES) {
    tables[tableName] = (await db.table(tableName).toArray()) as Array<Record<string, unknown>>
  }
  const settings = (await db.settings.get('app')) ?? null
  return { tables, settings }
}

export async function createBackupFile(): Promise<BackupFile> {
  const payload = await buildPayload()
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: nowIso(),
    ...payload,
  }
}

export async function exportBackupJson(): Promise<string> {
  return JSON.stringify(await createBackupFile(), null, 2)
}

export async function validateBackupFile(value: unknown): Promise<BackupFile> {
  const parsed = await backupFileSchema.parseAsync(value)
  return {
    ...parsed,
    settings: parsed.settings as AppSettings | null,
  }
}

async function snapshotBeforeImport(): Promise<void> {
  const record = {
    id: createId(),
    kind: 'pre-import' as const,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    payload: await buildPayload(),
  }
  await db.backups.put(record)
  const rows = await db.backups.where('kind').equals('pre-import').toArray()
  if (rows.length > 3) {
    const oldest = rows
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, rows.length - 3)
    await Promise.all(oldest.map((row) => db.backups.delete(row.id)))
  }
}

export async function restoreBackupFile(file: BackupFile): Promise<void> {
  await snapshotBeforeImport()
  await db.transaction('rw', db.tables, async () => {
    for (const tableName of BUSINESS_TABLE_NAMES) {
      await db.table(tableName).clear()
    }

    for (const tableName of BUSINESS_TABLE_NAMES) {
      const rows = file.tables[tableName]
      if (Array.isArray(rows) && rows.length > 0) {
        await db.table(tableName).bulkAdd(rows)
      }
    }

    if (file.settings) {
      await db.settings.put(file.settings as AppSettings)
    } else {
      await settingsRepo.reset()
    }
  })
}

export async function clearTables(tableNames: readonly string[]): Promise<void> {
  const tables = tableNames.map((name) => db.table(name))
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()))
  })
}

export async function clearModule(module: string): Promise<void> {
  const moduleTables: Record<string, string[]> = {
    memos: ['memos'],
    plan: ['planItems'],
    media: ['mediaAccounts', 'mediaContents'],
    dev: ['devProjects', 'devTasks', 'devBugs', 'devLogs', 'devMilestones'],
    consult: ['clients', 'consultSessions', 'consultFollowUps', 'consultSettlements'],
    fitness: ['workoutPlans', 'workoutSessions', 'bodyMetrics'],
    diet: ['mealDays', 'mealItems', 'mealFavorites'],
    games: ['games', 'playLogs', 'entertainmentItems'],
  }
  const tables = moduleTables[module]
  if (!tables) throw new Error(`未知模块：${module}`)
  await clearTables(tables)
}

export async function clearAllData(): Promise<void> {
  await clearTables(BUSINESS_TABLE_NAMES)
  await settingsRepo.reset()
}

export async function recordManualBackup(fileName?: string): Promise<void> {
  await settingsRepo.update({
    lastBackupAt: nowIso(),
    lastBackupFile: fileName,
  })
  const record: BackupRecord = {
    id: createId(),
    kind: 'manual',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    payload: await buildPayload(),
    fileMeta: {
      fileName,
      exportedAt: nowIso(),
    },
  }
  await db.backups.put(record)
}

export async function listRollbackPoints(): Promise<BackupRecord[]> {
  const rows = await db.backups.where('kind').equals('pre-import').toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function restoreRollbackPoint(id: string): Promise<void> {
  const record = await db.backups.get(id)
  if (!record || record.kind !== 'pre-import') throw new Error('回滚点不存在')
  await restoreBackupFile({
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: record.createdAt,
    ...record.payload,
  })
}
