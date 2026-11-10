import { db } from '../db'
import type {
  BodyMetric,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutSession,
} from '@/domain/types'
import { makeEntity, touch } from './base'
import { nowIso } from '@/utils/id'

export const fitnessRepo = {
  async listPlans(includeArchived = false): Promise<WorkoutPlan[]> {
    const rows = await db.workoutPlans.toArray()
    return rows.filter((plan) => includeArchived || !plan.archived)
  },

  async createPlan(
    name: string,
    weekdays: number[],
    exercises: WorkoutExercise[] = [],
  ): Promise<WorkoutPlan> {
    const plan = makeEntity<WorkoutPlan>({
      name,
      weekdays,
      exercises,
      archived: false,
    })
    await db.workoutPlans.add(plan)
    return plan
  },

  async updatePlan(id: string, patch: Partial<WorkoutPlan>): Promise<WorkoutPlan | undefined> {
    const current = await db.workoutPlans.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.workoutPlans.put(next)
    return next
  },

  async removePlan(id: string): Promise<void> {
    await db.transaction('rw', [db.workoutPlans, db.workoutSessions], async () => {
      await Promise.all([
        db.workoutPlans.delete(id),
        db.workoutSessions.where('planId').equals(id).delete(),
      ])
    })
  },

  async listSessions(): Promise<WorkoutSession[]> {
    const rows = await db.workoutSessions.toArray()
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  },

  async getSessionByDateAndPlan(date: string, planId: string): Promise<WorkoutSession | undefined> {
    return db.workoutSessions
      .where('[date+planId]')
      .equals([date, planId])
      .first()
      .catch(() => undefined)
  },

  async createSessionFromPlan(date: string, plan: WorkoutPlan): Promise<WorkoutSession> {
    const existing = await this.getSessionByDateAndPlan(date, plan.id)
    if (existing) return existing
    const session = makeEntity<WorkoutSession>({
      date,
      planId: plan.id,
      planName: plan.name,
      entries: plan.exercises.map((exercise) => ({
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.targetSets }, () => ({
          targetReps: exercise.targetReps,
          targetWeight: exercise.targetWeight,
          done: false,
        })),
      })),
      done: false,
    })
    await db.workoutSessions.add(session)
    return session
  },

  async updateSession(
    id: string,
    patch: Partial<WorkoutSession>,
  ): Promise<WorkoutSession | undefined> {
    const current = await db.workoutSessions.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.workoutSessions.put(next)
    return next
  },

  async completeSession(id: string, durationMin?: number, note?: string): Promise<void> {
    await this.updateSession(id, {
      done: true,
      completedAt: nowIso(),
      durationMin,
      note,
    })
  },

  async setSessionDone(id: string, done: boolean): Promise<void> {
    await this.updateSession(id, { done, completedAt: done ? nowIso() : undefined })
  },

  async listBodyMetrics(): Promise<BodyMetric[]> {
    const rows = await db.bodyMetrics.toArray()
    return rows.sort((a, b) => a.date.localeCompare(b.date))
  },

  async createBodyMetric(input: Omit<BodyMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<BodyMetric> {
    const metric = makeEntity<BodyMetric>(input)
    await db.bodyMetrics.add(metric)
    return metric
  },

  async updateBodyMetric(
    id: string,
    patch: Partial<BodyMetric>,
  ): Promise<BodyMetric | undefined> {
    const current = await db.bodyMetrics.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.bodyMetrics.put(next)
    return next
  },
}
