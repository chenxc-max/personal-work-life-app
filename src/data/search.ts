import { consultRepo } from './repositories/consult'
import { devRepo } from './repositories/dev'
import { dietRepo } from './repositories/diet'
import { fitnessRepo } from './repositories/fitness'
import { gamesRepo } from './repositories/games'
import { mediaRepo } from './repositories/media'
import { memoRepo } from './repositories/memos'
import { planRepo } from './repositories/plan'
import type { SearchResult } from '@/domain/types'

function includes(value: string | undefined, keyword: string): boolean {
  return Boolean(value?.toLowerCase().includes(keyword))
}

export async function searchAll(keyword: string): Promise<SearchResult[]> {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return []

  const results: SearchResult[] = []
  const memos = await memoRepo.list(500)
  const planItems = await planRepo.listAll()
  const mediaContents = await mediaRepo.listContents()
  const projects = await devRepo.listProjects(true)
  const devTasks = await devRepo.listAllTasks()
  const clients = await consultRepo.listClients()
  const followUps = await consultRepo.listOpenFollowUps()
  const workoutPlans = await fitnessRepo.listPlans(true)
  const workoutSessions = await fitnessRepo.listSessions()
  const favorites = await dietRepo.listFavorites()
  const mealItems = await dietRepo.listAllItems()
  const games = await gamesRepo.listGames()
  const entertainment = await gamesRepo.listEntertainment()

  for (const memo of memos) {
    if (includes(memo.content, normalized)) {
      results.push({
        id: memo.id,
        type: 'memo',
        title: memo.content,
        subtitle: '快速备忘',
        route: '/home',
        date: memo.createdAt,
      })
    }
  }
  for (const item of planItems) {
    if (includes(item.title, normalized) || includes(item.note, normalized)) {
      results.push({
        id: item.id,
        type: 'plan',
        title: item.title,
        subtitle: `今日计划 · ${item.date}`,
        route: '/plan',
        date: item.date,
      })
    }
  }
  for (const item of mediaContents) {
    if (
      includes(item.title, normalized) ||
      includes(item.idea, normalized) ||
      includes(item.draft, normalized)
    ) {
      results.push({
        id: item.id,
        type: 'media',
        title: item.title,
        subtitle: '自媒体内容',
        route: '/media',
        date: item.updatedAt,
      })
    }
  }
  for (const project of projects) {
    if (includes(project.name, normalized) || includes(project.description, normalized)) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: '开发项目',
        route: '/dev',
        date: project.updatedAt,
      })
    }
  }
  for (const task of devTasks) {
    if (includes(task.title, normalized) || includes(task.note, normalized)) {
      results.push({
        id: task.id,
        type: 'dev',
        title: task.title,
        subtitle: '开发待办',
        route: '/dev',
        date: task.updatedAt,
      })
    }
  }
  for (const client of clients) {
    if (includes(client.name, normalized) || includes(client.contact, normalized)) {
      results.push({
        id: client.id,
        type: 'client',
        title: client.name,
        subtitle: '咨询客户',
        route: '/consult',
        date: client.updatedAt,
      })
    }
  }
  for (const item of followUps) {
    if (includes(item.content, normalized)) {
      results.push({
        id: item.id,
        type: 'consult',
        title: item.content,
        subtitle: '咨询跟进',
        route: '/consult',
        date: item.updatedAt,
      })
    }
  }
  for (const plan of workoutPlans) {
    if (includes(plan.name, normalized)) {
      results.push({
        id: plan.id,
        type: 'fitness',
        title: plan.name,
        subtitle: '训练计划',
        route: '/fitness',
        date: plan.updatedAt,
      })
    }
  }
  for (const session of workoutSessions) {
    if (includes(session.planName, normalized)) {
      results.push({
        id: session.id,
        type: 'fitness',
        title: `${session.date} · ${session.planName}`,
        subtitle: '训练记录',
        route: '/fitness',
        date: session.date,
      })
    }
  }
  for (const favorite of favorites) {
    if (includes(favorite.name, normalized)) {
      results.push({
        id: favorite.id,
        type: 'diet',
        title: favorite.name,
        subtitle: '常用食物',
        route: '/diet',
        date: favorite.updatedAt,
      })
    }
  }
  for (const item of mealItems) {
    if (includes(item.name, normalized)) {
      results.push({
        id: item.id,
        type: 'diet',
        title: item.name,
        subtitle: `饮食记录 · ${item.date}`,
        route: '/diet',
        date: item.updatedAt,
      })
    }
  }
  for (const game of games) {
    if (includes(game.name, normalized) || includes(game.platform, normalized)) {
      results.push({
        id: game.id,
        type: 'game',
        title: game.name,
        subtitle: '游戏',
        route: '/games',
        date: game.updatedAt,
      })
    }
  }
  for (const item of entertainment) {
    if (includes(item.name, normalized)) {
      results.push({
        id: item.id,
        type: 'game',
        title: item.name,
        subtitle: '娱乐清单',
        route: '/games',
        date: item.updatedAt,
      })
    }
  }

  return results
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, 50)
}
