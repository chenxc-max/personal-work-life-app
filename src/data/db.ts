import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  BackupRecord,
  BodyMetric,
  Client,
  ConsultFollowUp,
  ConsultSession,
  ConsultSettlement,
  DevBug,
  DevLog,
  DevMilestone,
  DevProject,
  DevTask,
  EntertainmentItem,
  Game,
  MealDay,
  MealFavorite,
  MealItem,
  MediaAccount,
  MediaContent,
  Memo,
  PlanItem,
  PlayLog,
  WorkoutPlan,
  WorkoutSession,
} from '@/domain/types'

export class PersonalAppDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  memos!: EntityTable<Memo, 'id'>
  planItems!: EntityTable<PlanItem, 'id'>
  mediaAccounts!: EntityTable<MediaAccount, 'id'>
  mediaContents!: EntityTable<MediaContent, 'id'>
  devProjects!: EntityTable<DevProject, 'id'>
  devTasks!: EntityTable<DevTask, 'id'>
  devBugs!: EntityTable<DevBug, 'id'>
  devLogs!: EntityTable<DevLog, 'id'>
  devMilestones!: EntityTable<DevMilestone, 'id'>
  clients!: EntityTable<Client, 'id'>
  consultSessions!: EntityTable<ConsultSession, 'id'>
  consultFollowUps!: EntityTable<ConsultFollowUp, 'id'>
  consultSettlements!: EntityTable<ConsultSettlement, 'id'>
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>
  workoutSessions!: EntityTable<WorkoutSession, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>
  mealDays!: EntityTable<MealDay, 'id'>
  mealItems!: EntityTable<MealItem, 'id'>
  mealFavorites!: EntityTable<MealFavorite, 'id'>
  games!: EntityTable<Game, 'id'>
  playLogs!: EntityTable<PlayLog, 'id'>
  entertainmentItems!: EntityTable<EntertainmentItem, 'id'>
  backups!: EntityTable<BackupRecord, 'id'>

  constructor() {
    super('personal-work-life-app')
    this.version(1).stores({
      settings: 'id',
      memos: 'id, createdAt, status',
      planItems:
        'id, date, done, sourceType, sourceId, [date+sortOrder], [sourceType+sourceId], [date+done]',
      mediaAccounts: 'id, name',
      mediaContents: 'id, status, accountId, plannedPublishDate, [status+sortOrder]',
      devProjects: 'id, status, archived',
      devTasks: 'id, projectId, status, dueDate',
      devBugs: 'id, projectId, status, severity',
      devLogs: 'id, projectId, date, [projectId+date]',
      devMilestones: 'id, projectId, targetDate, status',
      clients: 'id, name, nextFollowUpDate',
      consultSessions: 'id, clientId, date, [clientId+date]',
      consultFollowUps: 'id, clientId, dueDate, status',
      consultSettlements: 'id, clientId, date, status',
      workoutPlans: 'id, name, archived',
      workoutSessions: 'id, date, planId, done, [date+planId]',
      bodyMetrics: 'id, date',
      mealDays: 'id, date, done',
      mealItems: 'id, date, meal, done, favoriteId, [date+meal+sortOrder]',
      mealFavorites: 'id, name, category',
      games: 'id, status, name',
      playLogs: 'id, gameId, date',
      entertainmentItems: 'id, status, type',
      backups: 'id, kind, createdAt',
    })
  }
}

export const db = new PersonalAppDatabase()
