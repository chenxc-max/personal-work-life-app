import {
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  History,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DateSwitcher } from '@/components/DateSwitcher'
import { PageHeader } from '@/components/PageHeader'
import { addFitnessToToday, syncSourceToPlan } from '@/data/planLink'
import { fitnessRepo } from '@/data/repositories/fitness'
import type {
  BodyMetric,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutSession,
} from '@/domain/types'
import { todayKey } from '@/utils/date'

interface ExerciseFormValues {
  name: string
  targetSets: number
  targetReps?: number
  targetWeight?: number
  unit: WorkoutExercise['unit']
}

interface PlanFormValues {
  name: string
  weekdays: number[]
  exercises: ExerciseFormValues[]
  note?: string
}

interface MetricFormValues {
  date: Dayjs
  weightKg?: number
  waistCm?: number
  note?: string
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function weekDates(dateKey: string): string[] {
  const start = dayjs(dateKey).startOf('week')
  return Array.from({ length: 7 }, (_, index) => start.add(index, 'day').format('YYYY-MM-DD'))
}

export function FitnessPage() {
  const { message } = App.useApp()
  const [date, setDate] = useState(todayKey())
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [metricModalOpen, setMetricModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null)
  const [planForm] = Form.useForm<PlanFormValues>()
  const [metricForm] = Form.useForm<MetricFormValues>()

  const plans = useLiveQuery<WorkoutPlan[], WorkoutPlan[]>(
    () => fitnessRepo.listPlans(),
    [],
    [],
  )
  const sessions = useLiveQuery<WorkoutSession[], WorkoutSession[]>(
    () => fitnessRepo.listSessions(),
    [],
    [],
  )
  const metrics = useLiveQuery<BodyMetric[], BodyMetric[]>(
    () => fitnessRepo.listBodyMetrics(),
    [],
    [],
  )

  const week = useMemo(() => weekDates(date), [date])
  const dayOfWeek = dayjs(date).day()
  const matchingPlans = plans.filter((plan) => plan.weekdays.includes(dayOfWeek))
  const dateSessions = sessions.filter((session) => session.date === date)
  const selectedSession = dateSessions[0]
  const chartData = metrics
    .filter((metric) => metric.weightKg !== undefined)
    .map((metric) => ({ date: metric.date, weight: metric.weightKg }))

  const openPlanForm = (plan?: WorkoutPlan) => {
    setEditingPlan(plan ?? null)
    planForm.setFieldsValue({
      name: plan?.name ?? '',
      weekdays: plan?.weekdays ?? [dayOfWeek],
      exercises: plan?.exercises.length
        ? plan.exercises
        : [{ name: '', targetSets: 3, targetReps: 10, unit: 'kg' }],
      note: plan?.note,
    })
    setPlanModalOpen(true)
  }

  const savePlan = async () => {
    const values = await planForm.validateFields()
    if (editingPlan) {
      await fitnessRepo.updatePlan(editingPlan.id, {
        name: values.name,
        weekdays: values.weekdays,
        exercises: values.exercises.map((exercise) => ({
          ...exercise,
          id: crypto.randomUUID(),
        })),
        note: values.note,
      })
      message.success('训练计划已更新')
    } else {
      await fitnessRepo.createPlan(
        values.name,
        values.weekdays,
        values.exercises.map((exercise) => ({
          ...exercise,
          id: crypto.randomUUID(),
        })),
      )
      message.success('训练计划已创建')
    }
    setPlanModalOpen(false)
    setEditingPlan(null)
    planForm.resetFields()
  }

  const startWorkout = async (plan: WorkoutPlan) => {
    const session = await fitnessRepo.createSessionFromPlan(date, plan)
    await addFitnessToToday(session.id, `完成训练：${plan.name}`)
    message.success('今日训练已开始，并加入今日计划')
  }

  const updateSet = async (
    session: WorkoutSession,
    entryIndex: number,
    setIndex: number,
    patch: Partial<WorkoutSession['entries'][number]['sets'][number]>,
  ) => {
    const entries = session.entries.map((entry, currentEntryIndex) => {
      if (currentEntryIndex !== entryIndex) return entry
      return {
        ...entry,
        sets: entry.sets.map((set, currentSetIndex) =>
          currentSetIndex === setIndex ? { ...set, ...patch } : set,
        ),
      }
    })
    await fitnessRepo.updateSession(session.id, { entries })
  }

  const finishWorkout = async (session: WorkoutSession) => {
    await fitnessRepo.completeSession(session.id, 60)
    await syncSourceToPlan('fitness', session.id, true)
    message.success('训练已完成并写入历史')
  }

  const openMetricForm = (metric?: BodyMetric) => {
    setEditingMetric(metric ?? null)
    metricForm.setFieldsValue({
      date: metric ? dayjs(metric.date) : dayjs(),
      weightKg: metric?.weightKg,
      waistCm: metric?.waistCm,
      note: metric?.note,
    })
    setMetricModalOpen(true)
  }

  const saveMetric = async () => {
    const values = await metricForm.validateFields()
    const input = {
      date: values.date.format('YYYY-MM-DD'),
      weightKg: values.weightKg,
      waistCm: values.waistCm,
      note: values.note,
    }
    if (editingMetric) {
      await fitnessRepo.updateBodyMetric(editingMetric.id, input)
      message.success('身体数据已更新')
    } else {
      const existing = metrics.find((metric) => metric.date === input.date)
      if (existing) {
        await fitnessRepo.updateBodyMetric(existing.id, input)
      } else {
        await fitnessRepo.createBodyMetric(input)
      }
      message.success('身体数据已记录')
    }
    setMetricModalOpen(false)
    setEditingMetric(null)
    metricForm.resetFields()
  }

  return (
    <>
      <PageHeader
        title="健身计划"
        description="安排训练、逐组打卡并记录身体变化"
        action={
          <Space>
            <Button
              data-testid="fitness-add-plan-button"
              icon={<Plus size={16} />}
              onClick={() => openPlanForm()}
            >
              新建训练计划
            </Button>
            <Button icon={<Activity size={16} />} onClick={() => openMetricForm()}>
              记录身体数据
            </Button>
          </Space>
        }
      />

      <div className="surface fitness-week-panel">
        <div className="surface-section">
          <DateSwitcher value={date} onChange={setDate} />
        </div>
        <div className="fitness-week-grid">
          {week.map((dayKey, index) => {
            const dayPlans = plans.filter((plan) => plan.weekdays.includes(index))
            const daySessions = sessions.filter((session) => session.date === dayKey)
            const isSelected = dayKey === date
            const isDone = daySessions.some((session) => session.done)
            return (
              <button
                type="button"
                className={`fitness-day${isSelected ? ' is-selected' : ''}${isDone ? ' is-done' : ''}`}
                onClick={() => setDate(dayKey)}
                key={dayKey}
                data-testid={`fitness-day-${dayKey}`}
              >
                <span>周{WEEKDAY_LABELS[index]}</span>
                <strong>{dayjs(dayKey).format('M/D')}</strong>
                <div>{dayPlans.length ? dayPlans.map((plan) => plan.name).join('、') : '休息'}</div>
              </button>
            )
          })}
        </div>
      </div>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} xl={8}>
          <section className="surface">
            <div className="surface-section fitness-section-heading">
              <div>
                <h2>训练计划</h2>
                <p>按星期安排动作、组数和次数</p>
              </div>
              <Dumbbell size={19} color="#b91c1c" />
            </div>
            {plans.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="还没有训练计划"
                style={{ padding: 24 }}
              />
            ) : (
              <List
                size="small"
                dataSource={plans}
                renderItem={(plan) => (
                  <List.Item
                    actions={[
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<Pencil size={14} />}
                        aria-label="编辑训练计划"
                        onClick={() => openPlanForm(plan)}
                      />,
                      <Popconfirm
                        key="delete"
                        title="删除训练计划？"
                        onConfirm={() => void fitnessRepo.removePlan(plan.id)}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 size={14} />}
                          aria-label="删除训练计划"
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={plan.name}
                      description={plan.exercises.map((exercise) => exercise.name).join('、')}
                    />
                  </List.Item>
                )}
              />
            )}
          </section>
        </Col>

        <Col xs={24} xl={16}>
          <section className="surface">
            <div className="surface-section fitness-section-heading">
              <div>
                <h2>今日训练</h2>
                <p>{dayjs(date).format('M月D日')} 的训练打卡</p>
              </div>
              {selectedSession ? (
                <Tag color={selectedSession.done ? 'green' : 'red'}>
                  {selectedSession.done ? '已完成' : '进行中'}
                </Tag>
              ) : null}
            </div>

            {selectedSession ? (
              <div className="workout-session">
                <div className="workout-plan-name">{selectedSession.planName}</div>
                {selectedSession.entries.map((entry, entryIndex) => (
                  <div className="workout-entry" key={`${entry.exerciseName}-${entryIndex}`}>
                    <div className="workout-entry-name">
                      <Dumbbell size={15} />
                      <span>{entry.exerciseName}</span>
                    </div>
                    <div className="workout-sets">
                      {entry.sets.map((set, setIndex) => (
                        <div className="workout-set" key={`${setIndex}-${set.targetReps}`}>
                          <Checkbox
                            checked={set.done}
                            onChange={(event) =>
                              void updateSet(selectedSession, entryIndex, setIndex, {
                                done: event.target.checked,
                              })
                            }
                          />
                          <span>第 {setIndex + 1} 组</span>
                          <InputNumber
                            min={0}
                            value={set.actualReps}
                            placeholder={String(set.targetReps ?? '')}
                            aria-label={`第${setIndex + 1}组实际次数`}
                            onChange={(value) =>
                              void updateSet(selectedSession, entryIndex, setIndex, {
                                actualReps: value ?? undefined,
                              })
                            }
                            style={{ width: 82 }}
                          />
                          <InputNumber
                            min={0}
                            value={set.actualWeight}
                            placeholder={String(set.targetWeight ?? '')}
                            aria-label={`第${setIndex + 1}组实际重量`}
                            onChange={(value) =>
                              void updateSet(selectedSession, entryIndex, setIndex, {
                                actualWeight: value ?? undefined,
                              })
                            }
                            style={{ width: 88 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={16} />}
                  disabled={selectedSession.done}
                  onClick={() => void finishWorkout(selectedSession)}
                >
                  {selectedSession.done ? '训练已完成' : '完成训练'}
                </Button>
              </div>
            ) : matchingPlans.length > 0 ? (
              <div className="fitness-start-options">
                {matchingPlans.map((plan) => (
                  <button
                    type="button"
                    className="surface fitness-plan-start"
                    onClick={() => void startWorkout(plan)}
                    key={plan.id}
                  >
                    <CalendarCheck size={18} color="#b91c1c" />
                    <span>
                      <strong>{plan.name}</strong>
                      <small>{plan.exercises.map((exercise) => exercise.name).join('、')}</small>
                    </span>
                    <span className="fitness-start-label">开始训练</span>
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="今天没有安排训练计划"
                style={{ padding: 34 }}
              />
            )}
          </section>

          <section className="surface" style={{ marginTop: 16 }}>
            <div className="surface-section fitness-section-heading">
              <div>
                <h2>训练历史</h2>
                <p>已完成和未完成的训练记录</p>
              </div>
              <History size={18} color="#b91c1c" />
            </div>
            {sessions.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有训练记录" />
            ) : (
              <List
                size="small"
                dataSource={[...sessions].sort((a, b) => b.date.localeCompare(a.date))}
                renderItem={(session) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag>{session.date}</Tag>
                          <span>{session.planName}</span>
                          {session.done ? <Tag color="green">已完成</Tag> : <Tag>未完成</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </section>
        </Col>
      </Row>

      <section className="surface" style={{ marginTop: 16 }}>
        <div className="surface-section fitness-section-heading">
          <div>
            <h2>身体数据</h2>
            <p>体重等基础数据的简单变化趋势</p>
          </div>
          <TrendingUp size={18} color="#b91c1c" />
        </div>
        {chartData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有身体数据"
            style={{ padding: 24 }}
          />
        ) : (
          <div style={{ height: 240, padding: '8px 20px 20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="体重 kg"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <Modal
        open={planModalOpen}
        title={editingPlan ? '编辑训练计划' : '新建训练计划'}
        okText={editingPlan ? '保存修改' : '创建计划'}
        cancelText="取消"
        onOk={() => void savePlan()}
        onCancel={() => {
          setPlanModalOpen(false)
          setEditingPlan(null)
          planForm.resetFields()
        }}
        width={720}
      >
        <Form
          form={planForm}
          layout="vertical"
          initialValues={{ weekdays: [dayOfWeek], exercises: [{ targetSets: 3, targetReps: 10, unit: 'kg' }] }}
        >
          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input data-testid="fitness-plan-name-input" />
          </Form.Item>
          <Form.Item name="weekdays" label="训练星期">
            <Checkbox.Group
              options={Array.from({ length: 7 }, (_, index) => ({
                label: `周${WEEKDAY_LABELS[index]}`,
                value: index,
              }))}
            />
          </Form.Item>
          <Form.List name="exercises">
            {(fields, { add, remove }) => (
              <div className="exercise-form-list">
                {fields.map((field, index) => (
                  <Space key={field.key} align="start" wrap>
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      label={index === 0 ? '动作' : ''}
                      rules={[{ required: true, message: '请输入动作名称' }]}
                    >
                      <Input data-testid={`fitness-exercise-name-${index}`} placeholder="例如 卧推" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'targetSets']}
                      label={index === 0 ? '组数' : ''}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'targetReps']}
                      label={index === 0 ? '次数' : ''}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'targetWeight']}
                      label={index === 0 ? '目标重量' : ''}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'unit']}
                      label={index === 0 ? '单位' : ''}
                    >
                      <Select
                        options={[
                          { label: 'kg', value: 'kg' },
                          { label: '次', value: 'count' },
                          { label: '分钟', value: 'min' },
                        ]}
                        style={{ width: 90 }}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 size={15} />}
                      aria-label="删除动作"
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                ))}
                <Button type="dashed" block icon={<Plus size={15} />} onClick={() => add()}>
                  添加动作
                </Button>
              </div>
            )}
          </Form.List>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={metricModalOpen}
        title={editingMetric ? '编辑身体数据' : '记录身体数据'}
        okText={editingMetric ? '保存修改' : '记录数据'}
        cancelText="取消"
        onOk={() => void saveMetric()}
        onCancel={() => {
          setMetricModalOpen(false)
          setEditingMetric(null)
          metricForm.resetFields()
        }}
      >
        <Form form={metricForm} layout="vertical">
          <Form.Item name="date" label="日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Space size={14}>
            <Form.Item name="weightKg" label="体重 kg">
              <InputNumber data-testid="fitness-weight-input" min={0} step={0.1} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="waistCm" label="腰围 cm">
              <InputNumber min={0} step={0.1} style={{ width: 140 }} />
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
