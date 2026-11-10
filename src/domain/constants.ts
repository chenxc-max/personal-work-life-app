import type { HomeSectionConfig, SourceType } from './types'

export const SOURCE_LABELS: Record<SourceType, string> = {
  manual: '本人',
  media: '自媒体',
  dev: '开发',
  consult: '咨询',
  fitness: '健身',
  diet: '饮食',
  game: '娱乐',
}

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { key: 'media', title: '自媒体', visible: true, order: 0 },
  { key: 'dev', title: '开发工作', visible: true, order: 1 },
  { key: 'consult', title: '咨询工作', visible: true, order: 2 },
  { key: 'fitness', title: '健身计划', visible: true, order: 3 },
  { key: 'diet', title: '饮食计划', visible: true, order: 4 },
  { key: 'games', title: '游戏娱乐', visible: true, order: 5 },
]

export const DEFAULT_ROUTE = '/home'
export const DEFAULT_WATER_GOAL_ML = 2000
