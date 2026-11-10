import {
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  TimePicker,
  Typography,
} from 'antd'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs, { type Dayjs } from 'dayjs'
import { CalendarPlus, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { addMediaToToday } from '@/data/planLink'
import { mediaRepo } from '@/data/repositories/media'
import type { MediaAccount, MediaContent, MediaStatus } from '@/domain/types'

const COLUMNS: Array<{ status: MediaStatus; title: string; hint: string }> = [
  { status: 'idea', title: '灵感', hint: '还没有成型的选题' },
  { status: 'writing', title: '创作中', hint: '正在写的内容' },
  { status: 'ready', title: '待发布', hint: '已经可以发布' },
  { status: 'published', title: '已发布', hint: '已发布并记录数据' },
]

const STATUS_LABELS: Record<MediaStatus, string> = {
  idea: '灵感',
  writing: '创作中',
  ready: '待发布',
  published: '已发布',
}

interface ContentFormValues {
  title: string
  idea?: string
  draft?: string
  accountId?: string
  platform?: string
  plannedPublishDate?: Dayjs
  plannedPublishTime?: Dayjs
  views?: number
  reads?: number
  likes?: number
  comments?: number
  followersGain?: number
  note?: string
}

function MediaCard({
  content,
  onOpen,
}: {
  content: MediaContent
  onOpen: (content: MediaContent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: content.id,
    data: { status: content.status },
  })
  return (
    <div
      ref={setNodeRef}
      className={`media-card${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`media-card-${content.id}`}
      onClick={() => onOpen(content)}
    >
      <button
        type="button"
        className="media-drag-handle"
        aria-label="拖动内容卡片"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <div className="media-card-body">
        <div className="media-card-title">{content.title}</div>
        {content.idea ? <div className="media-card-idea">{content.idea}</div> : null}
        <div className="media-card-meta">
          {content.platform ? <Tag>{content.platform}</Tag> : null}
          {content.plannedPublishDate ? (
            <Typography.Text type="secondary">
              {content.plannedPublishDate}
              {content.plannedPublishTime ? ` ${content.plannedPublishTime}` : ''}
            </Typography.Text>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MediaColumn({
  column,
  items,
  onOpen,
  onQuickAdd,
}: {
  column: (typeof COLUMNS)[number]
  items: MediaContent[]
  onOpen: (content: MediaContent) => void
  onQuickAdd?: (title: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status })
  const [quickTitle, setQuickTitle] = useState('')
  return (
    <section
      className={`media-column${isOver ? ' is-over' : ''}`}
      data-testid={`media-column-${column.status}`}
    >
      <div className="media-column-heading">
        <div>
          <strong>{column.title}</strong>
          <span>{items.length}</span>
        </div>
        <Typography.Text type="secondary">{column.hint}</Typography.Text>
      </div>
      {column.status === 'idea' && onQuickAdd ? (
        <div className="media-quick-add">
          <Input
            data-testid="media-add-idea-input"
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            onPressEnter={() => {
              if (quickTitle.trim()) {
                onQuickAdd(quickTitle.trim())
                setQuickTitle('')
              }
            }}
            placeholder="快速记一个灵感"
            suffix={
              <Button
                type="text"
                size="small"
                icon={<Plus size={15} />}
                aria-label="添加灵感"
                onClick={() => {
                  if (quickTitle.trim()) {
                    onQuickAdd(quickTitle.trim())
                    setQuickTitle('')
                  }
                }}
              />
            }
          />
        </div>
      ) : null}
      <div ref={setNodeRef} className="media-column-list">
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="media-column-empty">拖到这里</div>
          ) : (
            items.map((item) => (
              <MediaCard content={item} onOpen={onOpen} key={item.id} />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  )
}

export function MediaPage() {
  const { message } = App.useApp()
  const [accountFilter, setAccountFilter] = useState<string | undefined>()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<MediaAccount | null>(null)
  const [selectedContent, setSelectedContent] = useState<MediaContent | null>(null)
  const [contentForm] = Form.useForm<ContentFormValues>()
  const accounts = useLiveQuery(() => mediaRepo.listAccounts(), [], [])
  const contents = useLiveQuery(() => mediaRepo.listContents(), [], [])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }))

  const filteredContents = useMemo(() => {
    return accountFilter ? contents.filter((item) => item.accountId === accountFilter) : contents
  }, [accountFilter, contents])

  const openContent = (content: MediaContent) => {
    setSelectedContent(content)
    contentForm.setFieldsValue({
      title: content.title,
      idea: content.idea,
      draft: content.draft,
      accountId: content.accountId,
      platform: content.platform,
      plannedPublishDate: content.plannedPublishDate
        ? dayjs(content.plannedPublishDate)
        : undefined,
      plannedPublishTime: content.plannedPublishTime
        ? dayjs(content.plannedPublishTime, 'HH:mm')
        : undefined,
      views: content.metrics.views,
      reads: content.metrics.reads,
      likes: content.metrics.likes,
      comments: content.metrics.comments,
      followersGain: content.metrics.followersGain,
      note: content.note,
    })
  }

  const quickAdd = async (title: string) => {
    await mediaRepo.createContent({ title, status: 'idea' })
    message.success('灵感已记录')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const contentId = String(event.active.id)
    const targetStatus = String(event.over?.id) as MediaStatus
    if (!COLUMNS.some((column) => column.status === targetStatus)) return
    const content = contents.find((item) => item.id === contentId)
    if (!content || content.status === targetStatus) return
    await mediaRepo.moveContent(contentId, targetStatus)
  }

  const saveContent = async () => {
    if (!selectedContent) return
    const values = await contentForm.validateFields()
    await mediaRepo.updateContent(selectedContent.id, {
      title: values.title,
      idea: values.idea,
      draft: values.draft,
      accountId: values.accountId,
      platform: values.platform,
      plannedPublishDate: values.plannedPublishDate?.format('YYYY-MM-DD'),
      plannedPublishTime: values.plannedPublishTime?.format('HH:mm'),
      note: values.note,
      metrics: {
        views: values.views,
        reads: values.reads,
        likes: values.likes,
        comments: values.comments,
        followersGain: values.followersGain,
      },
    })
    message.success('内容已保存')
    setSelectedContent(null)
    contentForm.resetFields()
  }

  const saveAccount = async (name: string) => {
    if (editingAccount) {
      await mediaRepo.updateAccount(editingAccount.id, { name })
      message.success('账号已更新')
    } else {
      await mediaRepo.createAccount({ name })
      message.success('账号已添加')
    }
    setAccountModalOpen(false)
    setEditingAccount(null)
  }

  const joinToday = async () => {
    if (!selectedContent) return
    await addMediaToToday(selectedContent.id, `发布：${selectedContent.title}`)
    message.success('已加入今日计划')
  }

  return (
    <>
      <PageHeader
        title="自媒体"
        description="管理内容从灵感到发布的过程"
        action={
          <Space>
            <Select
              data-testid="media-account-filter"
              allowClear
              placeholder="全部账号/栏目"
              value={accountFilter}
              onChange={setAccountFilter}
              options={accounts.map((account) => ({ label: account.name, value: account.id }))}
              style={{ width: 190 }}
            />
            <Button
              data-testid="media-add-account-button"
              icon={<Plus size={16} />}
              onClick={() => setAccountModalOpen(true)}
            >
              管理账号
            </Button>
          </Space>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="media-board">
          {COLUMNS.map((column) => (
            <MediaColumn
              key={column.status}
              column={column}
              items={filteredContents.filter((item) => item.status === column.status)}
              onOpen={openContent}
              onQuickAdd={column.status === 'idea' ? quickAdd : undefined}
            />
          ))}
        </div>
      </DndContext>

      <Drawer
        open={selectedContent !== null}
        onClose={() => {
          setSelectedContent(null)
          contentForm.resetFields()
        }}
        title={
          selectedContent ? (
            <Space>
              {selectedContent.title}
              <Tag color="blue">{STATUS_LABELS[selectedContent.status]}</Tag>
            </Space>
          ) : (
            '内容详情'
          )
        }
        width={560}
        extra={
          selectedContent ? (
            <Space>
              {selectedContent.status !== 'published' && selectedContent.plannedPublishDate ? (
                <Button
                  data-testid="media-join-today"
                  icon={<CalendarPlus size={16} />}
                  onClick={() => void joinToday()}
                >
                  加入今日
                </Button>
              ) : null}
              <Popconfirm
                title="删除这条内容？"
                onConfirm={async () => {
                  await mediaRepo.removeContent(selectedContent.id)
                  setSelectedContent(null)
                  message.success('内容已删除')
                }}
              >
                <Button danger icon={<Trash2 size={16} />} aria-label="删除内容" />
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        <Form form={contentForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input data-testid="media-title-input" />
          </Form.Item>
          <Form.Item name="idea" label="选题说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="draft" label="文稿或要点">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Space size={14}>
            <Form.Item name="accountId" label="账号/栏目">
              <Select
                allowClear
                options={accounts.map((account) => ({ label: account.name, value: account.id }))}
                style={{ width: 190 }}
              />
            </Form.Item>
            <Form.Item name="platform" label="平台">
              <Input placeholder="例如 公众号" style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Space size={14}>
            <Form.Item name="plannedPublishDate" label="计划发布日">
              <DatePicker data-testid="media-plan-date" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="plannedPublishTime" label="计划发布时间">
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>
          <div className="drawer-section-title">发布数据</div>
          <Space wrap size={12}>
            <Form.Item name="views" label="播放">
              <InputNumber min={0} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="reads" label="阅读">
              <InputNumber min={0} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="likes" label="点赞">
              <InputNumber min={0} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="comments" label="评论">
              <InputNumber min={0} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="followersGain" label="涨粉">
              <InputNumber min={0} style={{ width: 110 }} />
            </Form.Item>
          </Space>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <Button type="primary" block data-testid="media-save-content" onClick={() => void saveContent()}>
          保存内容
        </Button>
      </Drawer>

      <Modal
        open={accountModalOpen}
        title={editingAccount ? '编辑账号' : '新增账号或栏目'}
        okText={editingAccount ? '保存修改' : '添加账号'}
        cancelText="取消"
        onOk={() => {
          const name = (
            document.querySelector<HTMLInputElement>('[data-testid="account-name-input"]')
          )?.value
          if (name?.trim()) void saveAccount(name.trim())
        }}
        onCancel={() => {
          setAccountModalOpen(false)
          setEditingAccount(null)
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            data-testid="account-name-input"
            placeholder="账号或栏目名称"
            defaultValue={editingAccount?.name}
          />
          {accounts.length > 0 ? (
            <>
              <Typography.Text type="secondary">已有账号</Typography.Text>
              <Space wrap>
                {accounts.map((account) => (
                  <Tag
                    key={account.id}
                    closable
                    icon={<Pencil size={12} />}
                    onClose={(event) => {
                      event.preventDefault()
                      void mediaRepo.removeAccount(account.id)
                    }}
                    onClick={() => setEditingAccount(account)}
                    style={{ cursor: 'pointer' }}
                  >
                    {account.name}
                  </Tag>
                ))}
              </Space>
            </>
          ) : null}
        </Space>
      </Modal>
    </>
  )
}
