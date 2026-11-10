import { db } from '../db'
import type {
  DevBug,
  DevLog,
  DevMilestone,
  DevProject,
  DevTask,
  Priority,
} from '@/domain/types'
import { makeEntity, nextSortOrder, touch } from './base'

export const devRepo = {
  async listProjects(includeArchived = false): Promise<DevProject[]> {
    const rows = await db.devProjects.toArray()
    return rows
      .filter((project) => includeArchived || !project.archived)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async getProject(id: string): Promise<DevProject | undefined> {
    return db.devProjects.get(id)
  },

  async createProject(name: string, description?: string): Promise<DevProject> {
    const project = makeEntity<DevProject>({
      name,
      description,
      status: 'active',
      archived: false,
      sortOrder: await nextSortOrder<DevProject>(db.devProjects),
    })
    await db.devProjects.add(project)
    return project
  },

  async updateProject(
    id: string,
    patch: Partial<DevProject>,
  ): Promise<DevProject | undefined> {
    const current = await db.devProjects.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.devProjects.put(next)
    return next
  },

  async archiveProject(id: string, archived = true): Promise<void> {
    await this.updateProject(id, { archived })
  },

  async removeProject(id: string): Promise<void> {
    await db.transaction('rw', [db.devProjects, db.devTasks, db.devBugs, db.devLogs, db.devMilestones], async () => {
      await Promise.all([
        db.devProjects.delete(id),
        db.devTasks.where('projectId').equals(id).delete(),
        db.devBugs.where('projectId').equals(id).delete(),
        db.devLogs.where('projectId').equals(id).delete(),
        db.devMilestones.where('projectId').equals(id).delete(),
      ])
    })
  },

  async listTasks(projectId: string): Promise<DevTask[]> {
    return db.devTasks.where('projectId').equals(projectId).toArray()
  },

  async listAllTasks(): Promise<DevTask[]> {
    return db.devTasks.toArray()
  },

  async createTask(
    projectId: string,
    title: string,
    priority: Priority = 'medium',
    dueDate?: string,
  ): Promise<DevTask> {
    const task = makeEntity<DevTask>({
      projectId,
      title,
      status: 'todo',
      priority,
      dueDate,
    })
    await db.devTasks.add(task)
    return task
  },

  async updateTask(id: string, patch: Partial<DevTask>): Promise<DevTask | undefined> {
    const current = await db.devTasks.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.devTasks.put(next)
    return next
  },

  async removeTask(id: string): Promise<void> {
    await db.devTasks.delete(id)
  },

  async setTaskDone(id: string, done: boolean): Promise<void> {
    await this.updateTask(id, { status: done ? 'done' : 'todo' })
  },

  async listBugs(projectId: string): Promise<DevBug[]> {
    return db.devBugs.where('projectId').equals(projectId).toArray()
  },

  async listAllBugs(): Promise<DevBug[]> {
    return db.devBugs.toArray()
  },

  async createBug(projectId: string, title: string): Promise<DevBug> {
    const bug = makeEntity<DevBug>({
      projectId,
      title,
      severity: 'medium',
      status: 'open',
    })
    await db.devBugs.add(bug)
    return bug
  },

  async updateBug(id: string, patch: Partial<DevBug>): Promise<DevBug | undefined> {
    const current = await db.devBugs.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.devBugs.put(next)
    return next
  },

  async removeBug(id: string): Promise<void> {
    await db.devBugs.delete(id)
  },

  async listLogs(projectId: string): Promise<DevLog[]> {
    const rows = await db.devLogs.where('projectId').equals(projectId).toArray()
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  },

  async createLog(projectId: string, date: string, content: string): Promise<DevLog> {
    const log = makeEntity<DevLog>({ projectId, date, content })
    await db.devLogs.add(log)
    return log
  },

  async updateLog(id: string, patch: Partial<DevLog>): Promise<DevLog | undefined> {
    const current = await db.devLogs.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.devLogs.put(next)
    return next
  },

  async removeLog(id: string): Promise<void> {
    await db.devLogs.delete(id)
  },

  async listMilestones(projectId: string): Promise<DevMilestone[]> {
    return db.devMilestones.where('projectId').equals(projectId).toArray()
  },

  async createMilestone(
    projectId: string,
    name: string,
    targetDate?: string,
  ): Promise<DevMilestone> {
    const milestone = makeEntity<DevMilestone>({
      projectId,
      name,
      targetDate,
      status: 'planned',
    })
    await db.devMilestones.add(milestone)
    return milestone
  },

  async updateMilestone(
    id: string,
    patch: Partial<DevMilestone>,
  ): Promise<DevMilestone | undefined> {
    const current = await db.devMilestones.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.devMilestones.put(next)
    return next
  },

  async removeMilestone(id: string): Promise<void> {
    await db.devMilestones.delete(id)
  },
}
