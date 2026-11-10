import {
  App,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
} from 'antd'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { CalendarClock, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { DateSwitcher } from '@/components/DateSwitcher'
import { setPlanItemDone } from '@/data/planLink'
import { planRepo } from '@/data/repositories/plan'
import type { PlanItem, Priority, SourceType } from '@/domain/types'
import { SOURCE_LABELS } from '@/domain/constants'
import { addDays, todayKey } from '@/utils/date'
import { useUndoStore } from '@/stores/undoStore'

const SOURCE_ROUTES: Partial<Record<SourceType, string>> = {
  media: '/media',
  dev: '/dev',
  consult: '/consult',
  fitness: '/fitness',
  diet: '/diet',
  game: '/games',
}

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'orange' },
  low: { label: '低', color: 'default' },
}

interface PlanFormValues {
  kind: PlanItem['kind']
  title: string
  note?: string
  priority: Priority
  startTime?: dayjs.Dayjs
}

function SortablePlanRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: PlanItem
  onToggle: (item: PlanItem) => void
  onEdit: (item: PlanItem) => void
  onDelete: (item: PlanItem) => void
}) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const route = item.sourceId ? SOURCE_ROUTES[item.sourceType] : undefined

  return (
    <div
      ref={setNodeRef}
      className={`plan-row${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`plan-item-${item.id}`}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Checkbox
        checked={item.done}
        onChange={() => onToggle(item)}
        aria-label={`完成 ${item.title}`}
      />
      <div className="plan-row-main">
        <div className={`plan-row-title${item.done ? ' is-done' : ''}`}>{item.title}</div>
        {item.note ? <div className="plan-row-note">{item.note}</div> : null}
      </div>
      {item.sourceType !== 'manual' ? (
        <Tag
          color="blue"
          style={{ cursor: route ? 'pointer' : 'default' }}
          onClick={() => route && navigate(route)}
        >
          {SOURCE_LABELS[item.sourceType]}
        </Tag>
      ) : null}
      {item.startTime ? (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {item.startTime}
        </Typography.Text>
      ) : null}
      <Tag color={PRIORITY_META[item.priority].color}>{PRIORITY_META[item.priority].label}</Tag>
      <Space size={2}>
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            icon={<Pencil size={15} />}
            aria-label="编辑"
            onClick={() => onEdit(item)}
          />
        </Tooltip>
        <Popconfirm title="删除这条计划？" onConfirm={() => onDelete(item)}>
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 size={15} />}
            aria-label="删除"
          />
        </Popconfirm>
      </Space>
    </div>
  )
}

export function PlanPage() {
  const { message, modal } = App.useApp()
  const showUndo = useUndoStore((state) => state.showUndo)
  const [date, setDate] = useState(todayKey())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlanItem | null>(null)
  const [rolloverOpen, setRolloverOpen] = useState(false)
  const [rolloverIds, setRolloverIds] = useState<string[]>([])
  const [form] = Form.useForm<PlanFormValues>()
  const items = useLiveQuery(() => planRepo.listByDate(date), [date], [])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const openItems = useMemo(() => items.filter((item) => !item.done), [items])
  const doneItems = useMemo(() => items.filter((item) => item.done), [items])
  const schedules = openItems.filter((item) => item.kind === 'schedule')
  const todos = openItems.filter((item) => item.kind === 'todo')

  const openForm = (item?: PlanItem) => {
    setEditing(item ?? null)
    form.setFieldsValue({
      kind: item?.kind ?? 'todo',
      title: item?.title ?? '',
      note: item?.note,
      priority: item?.priority ?? 'medium',
      startTime: item?.startTime ? dayjs(item.startTime, 'HH:mm') : undefined,
    })
    setFormOpen(true)
  }

  const saveForm = async () => {
    const values = await form.validateFields()
    if (editing) {
      await planRepo.update(editing.id, {
        ...values,
        startTime: values.startTime?.format('HH:mm'),
      })
      message.success('计划已更新')
    } else {
      await planRepo.create({
        date,
        ...values,
        startTime: values.startTime?.format('HH:mm'),
        sourceType: 'manual',
      })
      message.success('计划已添加')
    }
    setFormOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const deleteItem = async (item: PlanItem) => {
    const snapshot = { ...item }
    await planRepo.remove(item.id)
    showUndo(item.title, async () => {
      await planRepo.restore(snapshot)
      message.success('已撤销删除')
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return
    const ids = openItems.map((item) => item.id)
    const oldIndex = ids.indexOf(String(event.active.id))
    const newIndex = ids.indexOf(String(event.over.id))
    if (oldIndex < 0 || newIndex < 0) return
    await planRepo.reorder(date, arrayMove(ids, oldIndex, newIndex))
  }

  const applyRollover = async (mode: 'roll' | 'abandon') => {
    if (mode === 'roll') {
      await planRepo.rollover(date, addDays(date, 1), rolloverIds)
      message.success(`已顺延 ${rolloverIds.length} 项`)
    } else {
      await Promise.all(rolloverIds.map((id) => planRepo.remove(id)))
      message.success('已放弃所选未完成事项')
    }
    setRolloverOpen(false)
    setRolloverIds([])
  }

  const cancelForm = () => {
    if (!form.isFieldsTouched()) {
      setFormOpen(false)
      setEditing(null)
      form.resetFields()
      return
    }
    modal.confirm({
      title: '放弃未保存的修改？',
      content: '当前表单还没有保存，离开后会丢失修改。',
      okText: '放弃修改',
      cancelText: '继续编辑',
      onOk: () => {
        setFormOpen(false)
        setEditing(null)
        form.resetFields()
      },
    })
  }

  return (
    <>
      <PageHeader
        title="今日计划"
        description="管理当天和未来几天的日程与待办"
        action={
          <Space>
            {openItems.length > 0 && date < todayKey() ? (
              <Button onClick={() => setRolloverOpen(true)}>处理未完成事项</Button>
            ) : null}
            <Button
              data-testid="plan-add-button"
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => openForm()}
            >
              新建计划
            </Button>
          </Space>
        }
      />

      <div className="surface">
        <div className="surface-section">
          <DateSwitcher value={date} onChange={setDate} />
        </div>

        {items.length === 0 ? (
          <Empty
            style={{ padding: 46 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="这一天还没有计划"
          >
            <Button type="primary" onClick={() => openForm()}>
              添加第一条计划
            </Button>
          </Empty>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={openItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {schedules.length > 0 ? (
                <div className="plan-section">
                  <div className="plan-section-title">
                    <CalendarClock size={16} /> 固定日程
                  </div>
                  {schedules.map((item) => (
                    <SortablePlanRow
                      key={item.id}
                      item={item}
                      onToggle={(current) => void setPlanItemDone(current.id, !current.done)}
                      onEdit={openForm}
                      onDelete={(current) => void deleteItem(current)}
                    />
                  ))}
                </div>
              ) : null}

              {todos.length > 0 ? (
                <div className="plan-section">
                  <div className="plan-section-title">待办</div>
                  {todos.map((item) => (
                    <SortablePlanRow
                      key={item.id}
                      item={item}
                      onToggle={(current) => void setPlanItemDone(current.id, !current.done)}
                      onEdit={openForm}
                      onDelete={(current) => void deleteItem(current)}
                    />
                  ))}
                </div>
              ) : null}
            </SortableContext>
          </DndContext>
        )}

        {doneItems.length > 0 ? (
          <Collapse
            ghost
            items={[
              {
                key: 'done',
                label: (
                  <Badge count={doneItems.length} size="small">
                    已完成
                  </Badge>
                ),
                children: doneItems.map((item) => (
                  <div className="plan-row" key={item.id}>
                    <Checkbox
                      checked
                      onChange={() => void setPlanItemDone(item.id, false)}
                      aria-label={`取消完成 ${item.title}`}
                    />
                    <div className="plan-row-main">
                      <div className="plan-row-title is-done">{item.title}</div>
                    </div>
                    {item.sourceType !== 'manual' ? (
                      <Tag color="blue">{SOURCE_LABELS[item.sourceType]}</Tag>
                    ) : null}
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Pencil size={15} />}
                        aria-label="编辑"
                        onClick={() => openForm(item)}
                      />
                      <Popconfirm title="删除这条计划？" onConfirm={() => void deleteItem(item)}>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 size={15} />}
                          aria-label="删除"
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                )),
              },
            ]}
          />
        ) : null}
      </div>

      <Modal
        open={formOpen}
        title={editing ? '编辑计划' : '新建计划'}
        okText={editing ? '保存修改' : '添加计划'}
        cancelText="取消"
        onOk={saveForm}
        onCancel={cancelForm}
      >
        <Form form={form} layout="vertical" initialValues={{ kind: 'todo', priority: 'medium' }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input data-testid="plan-title-input" autoFocus maxLength={200} />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="kind" label="类型">
              <Radio.Group
                options={[
                  { label: '固定日程', value: 'schedule' },
                  { label: '待办', value: 'todo' },
                ]}
              />
            </Form.Item>
            <Form.Item name="priority" label="优先级">
              <Select
                options={[
                  { label: '高', value: 'high' },
                  { label: '中', value: 'medium' },
                  { label: '低', value: 'low' },
                ]}
                style={{ width: 100 }}
              />
            </Form.Item>
            <Form.Item name="startTime" label="开始时间">
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={rolloverOpen}
        title="处理未完成事项"
        okText="顺延到明天"
        cancelText="取消"
        onOk={() => void applyRollover('roll')}
        onCancel={() => setRolloverOpen(false)}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            <Button danger onClick={() => void applyRollover('abandon')} disabled={!rolloverIds.length}>
              放弃所选
            </Button>
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
      >
        <Typography.Paragraph type="secondary">
          选择需要处理的事项。不选择任何内容并关闭弹窗，代表暂时保留。
        </Typography.Paragraph>
        <Checkbox.Group
          value={rolloverIds}
          onChange={(values) => setRolloverIds(values as string[])}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {openItems.map((item) => (
              <Checkbox key={item.id} value={item.id}>
                {item.title}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Modal>
    </>
  )
}
