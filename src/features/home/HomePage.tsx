import { Button, Checkbox, Col, Input, List, Progress, Row, Tag, Typography } from 'antd'
import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MemoConvertModal } from '@/components/MemoConvertModal'
import { PageHeader } from '@/components/PageHeader'
import { setPlanItemDone } from '@/data/planLink'
import { consultRepo } from '@/data/repositories/consult'
import { devRepo } from '@/data/repositories/dev'
import { dietRepo } from '@/data/repositories/diet'
import { fitnessRepo } from '@/data/repositories/fitness'
import { gamesRepo } from '@/data/repositories/games'
import { mediaRepo } from '@/data/repositories/media'
import { memoRepo } from '@/data/repositories/memos'
import { planRepo } from '@/data/repositories/plan'
import { settingsRepo } from '@/data/repositories/settings'
import { SOURCE_LABELS } from '@/domain/constants'
import type { Memo, PlanItem } from '@/domain/types'
import { todayKey } from '@/utils/date'

const SOURCE_ROUTES: Record<string, string> = {
  media: '/media',
  dev: '/dev',
  consult: '/consult',
  fitness: '/fitness',
  diet: '/diet',
  game: '/games',
}

function HomePlanRow({ item }: { item: PlanItem }) {
  const navigate = useNavigate()
  return (
    <div className="home-plan-row" data-testid={`home-plan-${item.id}`}>
      <Checkbox
        checked={item.done}
        onChange={() => void setPlanItemDone(item.id, !item.done)}
        aria-label={`完成 ${item.title}`}
      />
      <div className="home-plan-content">
        <span className={item.done ? 'is-done' : ''}>{item.title}</span>
        {item.startTime ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {item.startTime}
          </Typography.Text>
        ) : null}
      </div>
      {item.sourceType !== 'manual' ? (
        <Tag
          color="blue"
          style={{ cursor: SOURCE_ROUTES[item.sourceType] ? 'pointer' : 'default' }}
          onClick={() => SOURCE_ROUTES[item.sourceType] && navigate(SOURCE_ROUTES[item.sourceType])}
        >
          {SOURCE_LABELS[item.sourceType]}
        </Tag>
      ) : null}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [memoText, setMemoText] = useState('')
  const [convertingMemo, setConvertingMemo] = useState<Memo | null>(null)
  const today = todayKey()
  const settings = useLiveQuery(() => settingsRepo.get(), [], undefined)
  const planItems = useLiveQuery(() => planRepo.listByDate(today), [today], [])
  const memos = useLiveQuery(() => memoRepo.listInbox(), [], [])
  const mediaContents = useLiveQuery(() => mediaRepo.listContents(), [], [])
  const projects = useLiveQuery(() => devRepo.listProjects(), [], [])
  const devTasks = useLiveQuery(() => devRepo.listAllTasks(), [], [])
  const devBugs = useLiveQuery(() => devRepo.listAllBugs(), [], [])
  const followUps = useLiveQuery(() => consultRepo.listOpenFollowUps(), [], [])
  const sessions = useLiveQuery(() => consultRepo.listAllSessions(), [], [])
  const workoutSessions = useLiveQuery(() => fitnessRepo.listSessions(), [], [])
  const bodyMetrics = useLiveQuery(() => fitnessRepo.listBodyMetrics(), [], [])
  const mealDay = useLiveQuery(() => dietRepo.getDay(today), [today], undefined)
  const mealItems = useLiveQuery(() => dietRepo.listItems(today), [today], [])
  const games = useLiveQuery(() => gamesRepo.listGames(), [], [])

  const openPlanItems = planItems.filter((item) => !item.done)
  const donePlanItems = planItems.filter((item) => item.done)
  const completion =
    planItems.length === 0 ? 0 : Math.round((donePlanItems.length / planItems.length) * 100)

  const visibleSections = useMemo(() => {
    return (settings?.homeSections ?? [])
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order)
  }, [settings])

  const summaries = useMemo(() => {
    const todaySessions = sessions.filter((session) => session.date === today)
    const playingGames = games.filter((game) => game.status === 'playing')
    const wishlistGames = games.filter((game) => game.status === 'wishlist')
    const mealDone = mealItems.filter((item) => item.done).length
    const latestMetric = bodyMetrics[bodyMetrics.length - 1]
    const latestPublished = mediaContents.find((item) => item.status === 'published')
    const todayWorkout = workoutSessions.find((session) => session.date === today)
    return [
      {
        key: 'media',
        title: '自媒体',
        route: '/media',
        accent: 'media',
        primary: `${mediaContents.filter((item) => item.status === 'ready').length} 条待发布`,
        secondary: latestPublished ? `最近发布：${latestPublished.title}` : '还没有已发布内容',
      },
      {
        key: 'dev',
        title: '开发工作',
        route: '/dev',
        accent: 'dev',
        primary: `${projects.filter((project) => project.status === 'active').length} 个进行中项目`,
        secondary: `${devTasks.filter((item) => item.status !== 'done').length} 个待办 · ${devBugs.filter((bug) => bug.status !== 'done').length} 个 Bug`,
      },
      {
        key: 'consult',
        title: '咨询工作',
        route: '/consult',
        accent: 'consult',
        primary: `${todaySessions.length} 场今日咨询`,
        secondary: `${followUps.length} 项待跟进`,
      },
      {
        key: 'fitness',
        title: '健身计划',
        route: '/fitness',
        accent: 'fitness',
        primary: todayWorkout ? `今日训练：${todayWorkout.planName}` : '今日暂无训练安排',
        secondary: latestMetric
          ? `最近体重：${latestMetric.weightKg ?? '-'} kg`
          : '还没有身体数据',
      },
      {
        key: 'diet',
        title: '饮食计划',
        route: '/diet',
        accent: 'diet',
        primary: `${mealDone}/${mealItems.length} 项已完成`,
        secondary: `饮水 ${mealDay?.waterActualMl ?? 0}/${mealDay?.waterGoalMl ?? 0} ml`,
      },
      {
        key: 'games',
        title: '游戏娱乐',
        route: '/games',
        accent: 'games',
        primary: `${playingGames.length} 个在玩`,
        secondary: `${wishlistGames.length} 个想玩`,
      },
    ].filter((summary) => visibleSections.some((section) => section.key === summary.key))
  }, [
    bodyMetrics,
    devBugs,
    devTasks,
    followUps,
    games,
    mediaContents,
    mealDay,
    mealItems,
    projects,
    sessions,
    today,
    visibleSections,
    workoutSessions,
  ])

  const addMemo = async () => {
    const content = memoText.trim()
    if (!content) return
    await memoRepo.create(content)
    setMemoText('')
  }

  return (
    <>
      <PageHeader
        title="首页总览"
        description={dayjs().format('YYYY年M月D日 dddd')}
        action={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/plan')}>
            查看今日计划
          </Button>
        }
      />

      <div className="home-overview surface">
        <div>
          <div className="overview-label">今日待办</div>
          <div className="overview-value">{openPlanItems.length}</div>
        </div>
        <div>
          <div className="overview-label">已完成</div>
          <div className="overview-value">{donePlanItems.length}</div>
        </div>
        <div className="overview-progress">
          <Progress
            type="circle"
            percent={completion}
            size={76}
            strokeColor="#2563eb"
            trailColor="#e5edf5"
          />
        </div>
      </div>

      <Row gutter={16} align="stretch" style={{ marginTop: 16 }}>
        <Col xs={24} xl={15}>
          <section className="surface home-plan-panel">
            <div className="surface-section home-section-heading">
              <div>
                <h2>今日计划</h2>
                <p>来自计划和各模块的事项</p>
              </div>
              <Button type="link" onClick={() => navigate('/plan')}>
                全部计划 <ArrowRight size={14} />
              </Button>
            </div>
            <div className="home-plan-list">
              {planItems.length === 0 ? (
                <div className="quiet-empty">今天还没有计划事项。</div>
              ) : (
                [...openPlanItems, ...donePlanItems].map((item) => (
                  <HomePlanRow item={item} key={item.id} />
                ))
              )}
            </div>
          </section>
        </Col>
        <Col xs={24} xl={9}>
          <section className="surface quick-memo-panel">
            <div className="surface-section home-section-heading">
              <div>
                <h2>快速备忘</h2>
                <p>随手记，之后再归类</p>
              </div>
              <Sparkles size={18} color="#2563eb" />
            </div>
            <div className="surface-section">
              <Input
                data-testid="quick-memo-input"
                value={memoText}
                onChange={(event) => setMemoText(event.target.value)}
                onPressEnter={addMemo}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<Plus size={15} />}
                    aria-label="添加备忘"
                    onClick={addMemo}
                  />
                }
                placeholder="写下一个想法"
              />
            </div>
            {memos.length === 0 ? (
              <div className="quiet-empty">还没有备忘。</div>
            ) : (
              <List
                size="small"
                dataSource={memos.slice(0, 8)}
                renderItem={(memo) => (
                  <List.Item
                    actions={[
                      <Button
                        key="convert"
                        type="link"
                        size="small"
                        data-testid={`convert-memo-${memo.id}`}
                        onClick={() => setConvertingMemo(memo)}
                      >
                        归类
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta title={<span>{memo.content}</span>} />
                  </List.Item>
                )}
              />
            )}
          </section>
        </Col>
      </Row>

      <section className="home-summary-grid">
        {summaries.map((summary) => (
          <button
            type="button"
            className="surface summary-card"
            data-testid={`summary-${summary.key}`}
            onClick={() => navigate(summary.route)}
            key={summary.key}
          >
            <div className={`module-accent-${summary.accent} summary-title`}>{summary.title}</div>
            <div className="summary-primary">{summary.primary}</div>
            <div className="summary-secondary">{summary.secondary}</div>
          </button>
        ))}
      </section>

      <MemoConvertModal
        memo={convertingMemo}
        open={convertingMemo !== null}
        onClose={() => setConvertingMemo(null)}
      />
    </>
  )
}
