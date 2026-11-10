export type Priority = 'high' | 'medium' | 'low'

export type PlanKind = 'schedule' | 'todo'

export type SourceType = 'manual' | 'media' | 'dev' | 'consult' | 'fitness' | 'diet' | 'game'

export interface TimeFields {
  id: string
  createdAt: string
  updatedAt: string
}

export interface HomeSectionConfig {
  key: string
  title: string
  visible: boolean
  order: number
}

export interface AppSettings extends TimeFields {
  id: 'app'
  defaultRoute: string
  homeSections: HomeSectionConfig[]
  waterGoalMl: number
  lastBackupAt?: string
  lastBackupFile?: string
}

export type MemoStatus = 'inbox' | 'converted'

export interface Memo extends TimeFields {
  content: string
  status: MemoStatus
  convertedToType?: SourceType
  convertedToId?: string
  convertedLabel?: string
}

export interface PlanItem extends TimeFields {
  date: string
  kind: PlanKind
  title: string
  note?: string
  priority: Priority
  startTime?: string
  done: boolean
  doneAt?: string
  sortOrder: number
  sourceType: SourceType
  sourceId?: string
  sourceTitle?: string
  rolledFromDate?: string
}

export interface MediaAccount extends TimeFields {
  name: string
  note?: string
  sortOrder: number
}

export type MediaStatus = 'idea' | 'writing' | 'ready' | 'published'

export interface MediaMetrics {
  views?: number
  reads?: number
  likes?: number
  comments?: number
  followersGain?: number
}

export interface MediaContent extends TimeFields {
  title: string
  idea?: string
  draft?: string
  accountId?: string
  platform?: string
  status: MediaStatus
  plannedPublishDate?: string
  plannedPublishTime?: string
  publishedAt?: string
  metrics: MediaMetrics
  note?: string
  sortOrder: number
}

export type DevProjectStatus = 'active' | 'maintenance' | 'paused' | 'done'
export type DevTaskStatus = 'todo' | 'doing' | 'done'
export type DevBugSeverity = 'low' | 'medium' | 'high' | 'critical'
export type DevBugStatus = 'open' | 'fixing' | 'done'
export type DevMilestoneStatus = 'planned' | 'done'

export interface DevProject extends TimeFields {
  name: string
  description?: string
  status: DevProjectStatus
  archived: boolean
  sortOrder: number
}

export interface DevTask extends TimeFields {
  projectId: string
  title: string
  status: DevTaskStatus
  priority: Priority
  dueDate?: string
  note?: string
}

export interface DevBug extends TimeFields {
  projectId: string
  title: string
  severity: DevBugSeverity
  status: DevBugStatus
  repro?: string
}

export interface DevLog extends TimeFields {
  projectId: string
  date: string
  content: string
}

export interface DevMilestone extends TimeFields {
  projectId: string
  name: string
  targetDate?: string
  status: DevMilestoneStatus
  note?: string
}

export interface Client extends TimeFields {
  name: string
  contact?: string
  note?: string
  nextFollowUpDate?: string
}

export interface ConsultSession extends TimeFields {
  clientId: string
  date: string
  topic?: string
  keyPoints?: string
  nextStep?: string
}

export type ConsultFollowUpStatus = 'open' | 'done'

export interface ConsultFollowUp extends TimeFields {
  clientId: string
  sessionId?: string
  content: string
  dueDate?: string
  status: ConsultFollowUpStatus
}

export type SettlementStatus = 'unpaid' | 'paid' | 'waived'

export interface ConsultSettlement extends TimeFields {
  clientId: string
  date: string
  quantity?: number
  amount?: number
  status: SettlementStatus
  note?: string
}

export interface WorkoutExercise {
  id: string
  name: string
  targetSets: number
  targetReps?: number
  targetWeight?: number
  unit: 'kg' | 'count' | 'min'
}

export interface WorkoutPlan extends TimeFields {
  name: string
  weekdays: number[]
  exercises: WorkoutExercise[]
  note?: string
  archived: boolean
}

export interface WorkoutSetResult {
  targetReps?: number
  targetWeight?: number
  actualReps?: number
  actualWeight?: number
  done: boolean
}

export interface WorkoutEntry {
  exerciseName: string
  sets: WorkoutSetResult[]
}

export interface WorkoutSession extends TimeFields {
  date: string
  planId?: string
  planName: string
  entries: WorkoutEntry[]
  durationMin?: number
  note?: string
  done: boolean
  completedAt?: string
}

export interface BodyMetric extends TimeFields {
  date: string
  weightKg?: number
  chestCm?: number
  waistCm?: number
  armCm?: number
  note?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealDay extends TimeFields {
  id: string
  date: string
  waterGoalMl: number
  waterActualMl: number
  done: boolean
  note?: string
}

export interface MealItem extends TimeFields {
  date: string
  meal: MealType
  name: string
  amount?: string
  done: boolean
  sortOrder: number
  favoriteId?: string
}

export interface MealFavorite extends TimeFields {
  name: string
  category: 'food' | 'recipe' | 'other'
  defaultAmount?: string
  note?: string
  sortOrder: number
  useCount: number
}

export type GameStatus = 'wishlist' | 'playing' | 'completed' | 'dropped'

export interface Game extends TimeFields {
  name: string
  platform?: string
  status: GameStatus
  totalMinutes: number
  rating?: number
  review?: string
  sortOrder: number
}

export interface PlayLog extends TimeFields {
  gameId: string
  date: string
  minutes: number
  note?: string
}

export type EntertainmentType = 'movie' | 'series' | 'book' | 'other'
export type EntertainmentStatus = 'wishlist' | 'inProgress' | 'done' | 'dropped'

export interface EntertainmentItem extends TimeFields {
  name: string
  type: EntertainmentType
  status: EntertainmentStatus
  note?: string
  sortOrder: number
}

export type BackupKind = 'pre-import' | 'manual'

export interface BackupRecord extends TimeFields {
  kind: BackupKind
  payload: BackupPayload
  fileMeta?: {
    fileName?: string
    exportedAt?: string
  }
}

export interface BackupPayload {
  tables: Record<string, Array<Record<string, unknown>>>
  settings: AppSettings | null
}

export interface BackupFile extends BackupPayload {
  app: 'personal-work-life-app'
  schemaVersion: 1
  exportedAt: string
}

export interface SearchResult {
  id: string
  type: SourceType | 'memo' | 'plan' | 'project' | 'client' | 'game'
  title: string
  subtitle?: string
  route: string
  date?: string
}
