import {
  App,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Rate,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Clock3,
  Clapperboard,
  Gamepad2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { gamesRepo } from '@/data/repositories/games'
import type {
  EntertainmentItem,
  EntertainmentStatus,
  EntertainmentType,
  Game,
  GameStatus,
} from '@/domain/types'

interface GameFormValues {
  name: string
  platform?: string
  status: GameStatus
  rating?: number
  review?: string
}

interface PlayFormValues {
  date: Dayjs
  minutes: number
  note?: string
}

interface EntertainmentFormValues {
  name: string
  type: EntertainmentType
  status: EntertainmentStatus
  note?: string
}

const GAME_STATUS_OPTIONS: Array<{ label: string; value: GameStatus }> = [
  { label: '想玩', value: 'wishlist' },
  { label: '在玩', value: 'playing' },
  { label: '已通关', value: 'completed' },
  { label: '弃坑', value: 'dropped' },
]

const ENTERTAINMENT_TYPE_OPTIONS = [
  { label: '电影', value: 'movie' },
  { label: '剧集', value: 'series' },
  { label: '书', value: 'book' },
  { label: '其他', value: 'other' },
]

const ENTERTAINMENT_STATUS_OPTIONS = [
  { label: '想看', value: 'wishlist' },
  { label: '进行中', value: 'inProgress' },
  { label: '已完成', value: 'done' },
  { label: '放弃', value: 'dropped' },
]

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

export function GamesPage() {
  const { message } = App.useApp()
  const [statusFilter, setStatusFilter] = useState<'all' | GameStatus>('all')
  const [gameModalOpen, setGameModalOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [playGame, setPlayGame] = useState<Game | null>(null)
  const [entertainmentModalOpen, setEntertainmentModalOpen] = useState(false)
  const [editingEntertainment, setEditingEntertainment] = useState<EntertainmentItem | null>(null)
  const [gameForm] = Form.useForm<GameFormValues>()
  const [playForm] = Form.useForm<PlayFormValues>()
  const [entertainmentForm] = Form.useForm<EntertainmentFormValues>()

  const games = useLiveQuery<Game[], Game[]>(() => gamesRepo.listGames(), [], [])
  const entertainmentItems = useLiveQuery<EntertainmentItem[], EntertainmentItem[]>(
    () => gamesRepo.listEntertainment(),
    [],
    [],
  )

  const visibleGames = useMemo(() => {
    if (statusFilter === 'all') return games
    return games.filter((game) => game.status === statusFilter)
  }, [games, statusFilter])

  const openGameForm = (game?: Game) => {
    setEditingGame(game ?? null)
    gameForm.setFieldsValue({
      name: game?.name ?? '',
      platform: game?.platform,
      status: game?.status ?? 'wishlist',
      rating: game?.rating,
      review: game?.review,
    })
    setGameModalOpen(true)
  }

  const saveGame = async () => {
    const values = await gameForm.validateFields()
    if (editingGame) {
      await gamesRepo.updateGame(editingGame.id, values)
      message.success('游戏信息已更新')
    } else {
      const game = await gamesRepo.createGame(values.name, values.platform)
      await gamesRepo.updateGame(game.id, {
        status: values.status,
        rating: values.rating,
        review: values.review,
      })
      message.success('游戏已添加')
    }
    setGameModalOpen(false)
    setEditingGame(null)
    gameForm.resetFields()
  }

  const savePlay = async () => {
    if (!playGame) return
    const values = await playForm.validateFields()
    await gamesRepo.recordPlay(
      playGame.id,
      values.date.format('YYYY-MM-DD'),
      values.minutes,
      values.note,
    )
    message.success('游玩时长已记录')
    setPlayGame(null)
    playForm.resetFields()
  }

  const openEntertainmentForm = (item?: EntertainmentItem) => {
    setEditingEntertainment(item ?? null)
    entertainmentForm.setFieldsValue({
      name: item?.name ?? '',
      type: item?.type ?? 'movie',
      status: item?.status ?? 'wishlist',
      note: item?.note,
    })
    setEntertainmentModalOpen(true)
  }

  const saveEntertainment = async () => {
    const values = await entertainmentForm.validateFields()
    if (editingEntertainment) {
      await gamesRepo.updateEntertainment(editingEntertainment.id, values)
      message.success('娱乐清单已更新')
    } else {
      await gamesRepo.createEntertainment(values.name, values.type)
      const item = await gamesRepo.listEntertainment()
      const created = item.find((entry) => entry.name === values.name)
      if (created) {
        await gamesRepo.updateEntertainment(created.id, {
          status: values.status,
          note: values.note,
        })
      }
      message.success('娱乐清单已添加')
    }
    setEntertainmentModalOpen(false)
    setEditingEntertainment(null)
    entertainmentForm.resetFields()
  }

  return (
    <>
      <PageHeader
        title="游戏娱乐"
        description="管理游戏库、游玩记录和娱乐清单"
        action={
          <Button
            data-testid="games-add-game-button"
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => openGameForm()}
          >
            添加游戏
          </Button>
        }
      />

      <div className="games-toolbar surface">
        <Segmented
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as 'all' | GameStatus)}
          options={[
            { label: '全部', value: 'all' },
            ...GAME_STATUS_OPTIONS,
          ]}
        />
      </div>

      {visibleGames.length === 0 ? (
        <Empty
          style={{ padding: 60 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="这个状态下还没有游戏"
        />
      ) : (
        <div className="games-grid">
          {visibleGames.map((game) => (
            <section className="surface game-card" key={game.id} data-testid={`game-${game.id}`}>
              <div className="game-card-top">
                <Gamepad2 size={22} color="#0e7490" />
                <Space>
                  <Select
                    size="small"
                    value={game.status}
                    options={GAME_STATUS_OPTIONS}
                    onChange={(value) => void gamesRepo.setStatus(game.id, value)}
                    style={{ width: 92 }}
                    aria-label={`${game.name} 状态`}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<Pencil size={15} />}
                    aria-label={`编辑 ${game.name}`}
                    onClick={() => openGameForm(game)}
                  />
                  <Popconfirm
                    title="删除这个游戏？"
                    onConfirm={() => void gamesRepo.removeGame(game.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 size={15} />}
                      aria-label={`删除 ${game.name}`}
                    />
                  </Popconfirm>
                </Space>
              </div>
              <h2>{game.name}</h2>
              <Typography.Text type="secondary">{game.platform || '未填写平台'}</Typography.Text>
              <div className="game-card-stats">
                <span>
                  <Clock3 size={15} />
                  {formatDuration(game.totalMinutes)}
                </span>
                <span>
                  <Star size={15} />
                  {game.rating ? `${game.rating} 分` : '未评分'}
                </span>
              </div>
              {game.review ? <div className="game-review">{game.review}</div> : null}
              <Button
                data-testid={`record-play-${game.id}`}
                icon={<Plus size={15} />}
                onClick={() => {
                  setPlayGame(game)
                  playForm.setFieldsValue({ date: dayjs(), minutes: 60 })
                }}
              >
                记录游玩
              </Button>
            </section>
          ))}
        </div>
      )}

      <section className="surface" style={{ marginTop: 18 }}>
        <div className="surface-section entertainment-heading">
          <div>
            <h2>娱乐清单</h2>
            <p>电影、剧集、书和其他想尝试的内容</p>
          </div>
          <Button icon={<Clapperboard size={16} />} onClick={() => openEntertainmentForm()}>
            添加娱乐
          </Button>
        </div>
        {entertainmentItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有娱乐清单"
            style={{ padding: 24 }}
          />
        ) : (
          <List
            dataSource={entertainmentItems}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Select
                    key="status"
                    size="small"
                    value={item.status}
                    options={ENTERTAINMENT_STATUS_OPTIONS}
                    onChange={(value) =>
                      void gamesRepo.updateEntertainment(item.id, { status: value })
                    }
                    style={{ width: 100 }}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<Pencil size={14} />}
                    aria-label={`编辑 ${item.name}`}
                    onClick={() => openEntertainmentForm(item)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="删除这项娱乐？"
                    onConfirm={() => void gamesRepo.removeEntertainment(item.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 size={14} />}
                      aria-label={`删除 ${item.name}`}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.name}</span>
                      <Tag>
                        {ENTERTAINMENT_TYPE_OPTIONS.find((option) => option.value === item.type)
                          ?.label}
                      </Tag>
                    </Space>
                  }
                  description={item.note}
                />
              </List.Item>
            )}
          />
        )}
      </section>

      <Modal
        open={gameModalOpen}
        title={editingGame ? '编辑游戏' : '添加游戏'}
        okText={editingGame ? '保存修改' : '添加游戏'}
        cancelText="取消"
        onOk={() => void saveGame()}
        onCancel={() => {
          setGameModalOpen(false)
          setEditingGame(null)
          gameForm.resetFields()
        }}
      >
        <Form form={gameForm} layout="vertical" initialValues={{ status: 'wishlist' }}>
          <Form.Item name="name" label="游戏名称" rules={[{ required: true, message: '请输入游戏名称' }]}>
            <Input data-testid="games-name-input" />
          </Form.Item>
          <Form.Item name="platform" label="平台">
            <Input placeholder="例如 Switch" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={GAME_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="rating" label="评分">
            <Rate />
          </Form.Item>
          <Form.Item name="review" label="短评">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={playGame !== null}
        title={`记录游玩：${playGame?.name ?? ''}`}
        okText="保存时长"
        cancelText="取消"
        onOk={() => void savePlay()}
        onCancel={() => {
          setPlayGame(null)
          playForm.resetFields()
        }}
      >
        <Form form={playForm} layout="vertical">
          <Form.Item name="date" label="日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="minutes"
            label="游玩分钟数"
            rules={[{ required: true, message: '请输入游玩分钟数' }]}
          >
            <InputNumber data-testid="games-play-minutes-input" min={1} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={entertainmentModalOpen}
        title={editingEntertainment ? '编辑娱乐' : '添加娱乐'}
        okText={editingEntertainment ? '保存修改' : '添加娱乐'}
        cancelText="取消"
        onOk={() => void saveEntertainment()}
        onCancel={() => {
          setEntertainmentModalOpen(false)
          setEditingEntertainment(null)
          entertainmentForm.resetFields()
        }}
      >
        <Form form={entertainmentForm} layout="vertical" initialValues={{ type: 'movie', status: 'wishlist' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input data-testid="entertainment-name-input" />
          </Form.Item>
          <Space size={14}>
            <Form.Item name="type" label="类型">
              <Select options={ENTERTAINMENT_TYPE_OPTIONS} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={ENTERTAINMENT_STATUS_OPTIONS} style={{ width: 130 }} />
            </Form.Item>
          </Space>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
