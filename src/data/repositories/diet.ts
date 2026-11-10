import { db } from '../db'
import type { MealDay, MealFavorite, MealItem, MealType } from '@/domain/types'
import { makeEntity, touch } from './base'
import { settingsRepo } from './settings'

function emptyMealDay(date: string, waterGoalMl: number): MealDay {
  const base = makeEntity<MealDay>({
    date,
    waterGoalMl,
    waterActualMl: 0,
    done: false,
  })
  return { ...base, id: date }
}

export const dietRepo = {
  async getDay(date: string): Promise<MealDay | undefined> {
    return db.mealDays.get(date)
  },

  async getOrCreateDay(date: string): Promise<MealDay> {
    const existing = await db.mealDays.get(date)
    if (existing) return existing
    const settings = await settingsRepo.get()
    const day = emptyMealDay(date, settings.waterGoalMl)
    await db.mealDays.put(day)
    return day
  },

  async listItems(date: string): Promise<MealItem[]> {
    const rows = await db.mealItems.where('date').equals(date).toArray()
    return rows.sort((a, b) => {
      if (a.meal !== b.meal) {
        const order: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
        return order.indexOf(a.meal) - order.indexOf(b.meal)
      }
      return a.sortOrder - b.sortOrder
    })
  },

  async listAllItems(): Promise<MealItem[]> {
    return db.mealItems.toArray()
  },

  async addItem(date: string, meal: MealType, name: string, amount?: string): Promise<MealItem> {
    await this.getOrCreateDay(date)
    const rows = await db.mealItems.where('[date+meal]').equals([date, meal]).toArray()
    const sortOrder = rows.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1
    const item = makeEntity<MealItem>({
      date,
      meal,
      name,
      amount,
      done: false,
      sortOrder,
    })
    await db.mealItems.add(item)
    return item
  },

  async updateItem(id: string, patch: Partial<MealItem>): Promise<MealItem | undefined> {
    const current = await db.mealItems.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.mealItems.put(next)
    return next
  },

  async removeItem(id: string): Promise<void> {
    await db.mealItems.delete(id)
  },

  async copyMeal(sourceDate: string, targetDate: string, meal?: MealType): Promise<void> {
    const rows = await db.mealItems.where('date').equals(sourceDate).toArray()
    const selected = rows.filter((item) => !meal || item.meal === meal)
    await db.transaction('rw', [db.mealItems, db.mealDays, db.settings], async () => {
      await this.getOrCreateDay(targetDate)
      for (const row of selected) {
        const copied = makeEntity<MealItem>({
          date: targetDate,
          meal: row.meal,
          name: row.name,
          amount: row.amount,
          done: false,
          sortOrder: row.sortOrder,
          favoriteId: row.favoriteId,
        })
        await db.mealItems.add(copied)
      }
    })
  },

  async addWater(date: string, amountMl: number): Promise<MealDay> {
    const day = await this.getOrCreateDay(date)
    const next = touch({ ...day, waterActualMl: Math.max(0, day.waterActualMl + amountMl) })
    await db.mealDays.put(next)
    return next
  },

  async setWater(date: string, amountMl: number): Promise<MealDay> {
    const day = await this.getOrCreateDay(date)
    const next = touch({ ...day, waterActualMl: Math.max(0, amountMl) })
    await db.mealDays.put(next)
    return next
  },

  async setDayDone(date: string, done: boolean): Promise<void> {
    const day = await this.getOrCreateDay(date)
    await db.mealDays.put(touch({ ...day, done }))
  },

  async updateDay(date: string, patch: Partial<MealDay>): Promise<MealDay> {
    const day = await this.getOrCreateDay(date)
    const next = touch({ ...day, ...patch, id: date, date })
    await db.mealDays.put(next)
    return next
  },

  async listFavorites(): Promise<MealFavorite[]> {
    const rows = await db.mealFavorites.toArray()
    return rows.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async createFavorite(
    name: string,
    category: MealFavorite['category'] = 'food',
    defaultAmount?: string,
  ): Promise<MealFavorite> {
    const favorite = makeEntity<MealFavorite>({
      name,
      category,
      defaultAmount,
      sortOrder: (await db.mealFavorites.toArray()).length,
      useCount: 0,
    })
    await db.mealFavorites.add(favorite)
    return favorite
  },

  async updateFavorite(
    id: string,
    patch: Partial<MealFavorite>,
  ): Promise<MealFavorite | undefined> {
    const current = await db.mealFavorites.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.mealFavorites.put(next)
    return next
  },

  async removeFavorite(id: string): Promise<void> {
    await db.mealFavorites.delete(id)
  },

  async addFavoriteToMeal(
    favoriteId: string,
    date: string,
    meal: MealType,
  ): Promise<MealItem> {
    const favorite = await db.mealFavorites.get(favoriteId)
    if (!favorite) throw new Error('常用食物不存在')
    await this.updateFavorite(favoriteId, { useCount: favorite.useCount + 1 })
    const item = await this.addItem(date, meal, favorite.name, favorite.defaultAmount)
    await this.updateItem(item.id, { favoriteId })
    return item
  },
}
