import { db } from '../db'
import {
  clearAllData,
  createBackupFile,
  exportBackupJson,
  restoreBackupFile,
  validateBackupFile,
} from '../backup'
import { devRepo } from '../repositories/dev'
import { memoRepo } from '../repositories/memos'
import { settingsRepo } from '../repositories/settings'

describe('local backup and restore', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  it('round-trips all business data through a JSON backup', async () => {
    const project = await devRepo.createProject('备份测试项目')
    await devRepo.createTask(project.id, '待办 A')
    await memoRepo.create('备份备忘')
    await settingsRepo.update({ waterGoalMl: 2500 })

    const json = await exportBackupJson()
    const file = await validateBackupFile(JSON.parse(json))
    await clearAllData()

    expect(await db.devProjects.count()).toBe(0)
    await restoreBackupFile(file)

    expect(await db.devProjects.count()).toBe(1)
    expect(await db.devTasks.count()).toBe(1)
    expect(await db.memos.count()).toBe(1)
    expect((await settingsRepo.get()).waterGoalMl).toBe(2500)
  })

  it('rejects malformed files without changing current data', async () => {
    await memoRepo.create('不能丢的备忘')

    await expect(validateBackupFile({ app: 'wrong' })).rejects.toThrow()
    await expect(validateBackupFile({ ...(await createBackupFile()), schemaVersion: 2 })).rejects.toThrow()

    expect(await db.memos.count()).toBe(1)
  })

  it('creates a pre-import rollback point before restoring', async () => {
    await memoRepo.create('导入前的数据')
    const backup = await createBackupFile()
    await memoRepo.create('额外数据')

    await restoreBackupFile(backup)

    const rollbackRows = await db.backups.where('kind').equals('pre-import').toArray()
    expect(rollbackRows).toHaveLength(1)
    expect(await db.memos.count()).toBe(1)
  })
})
