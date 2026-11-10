import {
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Archive,
  Bug,
  CalendarPlus,
  Code2,
  Flag,
  FolderKanban,
  Logs,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { addDevTaskToToday } from '@/data/planLink'
import { devRepo } from '@/data/repositories/dev'
import type {
  DevBug,
  DevLog,
  DevMilestone,
  DevProject,
  DevTask,
  Priority,
} from '@/domain/types'

const PROJECT_STATUS_OPTIONS = [
  { label: '进行中', value: 'active' },
  { label: '维护中', value: 'maintenance' },
  { label: '暂停', value: 'paused' },
  { label: '已完成', value: 'done' },
]

const TASK_STATUS_OPTIONS = [
  { label: '待处理', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
]

const BUG_SEVERITY_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
]

const PRIORITY_OPTIONS = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

interface TaskFormValues {
  title: string
  priority: Priority
  dueDate?: Dayjs
  note?: string
}

interface BugFormValues {
  title: string
  severity: DevBug['severity']
  repro?: string
}

interface MilestoneFormValues {
  name: string
  targetDate?: Dayjs
  note?: string
}

export function DevPage() {
  const { message } = App.useApp()
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const [showArchived, setShowArchived] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DevProject | null>(null)
  const [projectForm] = Form.useForm<{ name: string; description?: string }>()
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskForm] = Form.useForm<TaskFormValues>()
  const [bugModalOpen, setBugModalOpen] = useState(false)
  const [bugForm] = Form.useForm<BugFormValues>()
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logForm] = Form.useForm<{ content: string; date: Dayjs }>()
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [milestoneForm] = Form.useForm<MilestoneFormValues>()
  const [editingTask, setEditingTask] = useState<DevTask | null>(null)
  const [editingBug, setEditingBug] = useState<DevBug | null>(null)
  const [editingLog, setEditingLog] = useState<DevLog | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<DevMilestone | null>(null)

  const projects = useLiveQuery<DevProject[], DevProject[]>(
    () => devRepo.listProjects(showArchived),
    [showArchived],
    [],
  )
  const selectedProject = useLiveQuery<DevProject | undefined>(
    async () => {
      if (selectedProjectId) return devRepo.getProject(selectedProjectId)
      const first = projects[0]
      return first
    },
    [projects, selectedProjectId],
  )
  const tasks = useLiveQuery<DevTask[], DevTask[]>(
    () => (selectedProject?.id ? devRepo.listTasks(selectedProject.id) : Promise.resolve([])),
    [selectedProject],
    [],
  )
  const bugs = useLiveQuery<DevBug[], DevBug[]>(
    () => (selectedProject?.id ? devRepo.listBugs(selectedProject.id) : Promise.resolve([])),
    [selectedProject],
    [],
  )
  const logs = useLiveQuery<DevLog[], DevLog[]>(
    () => (selectedProject?.id ? devRepo.listLogs(selectedProject.id) : Promise.resolve([])),
    [selectedProject],
    [],
  )
  const milestones = useLiveQuery<DevMilestone[], DevMilestone[]>(
    () => (selectedProject?.id ? devRepo.listMilestones(selectedProject.id) : Promise.resolve([])),
    [selectedProject],
    [],
  )

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])
  const doneTasks = tasks.filter((task) => task.status === 'done')
  const openBugs = bugs.filter((bug) => bug.status !== 'done')
  const doneBugs = bugs.filter((bug) => bug.status === 'done')

  const createProject = async () => {
    const values = await projectForm.validateFields()
    if (editingProject) {
      await devRepo.updateProject(editingProject.id, {
        name: values.name,
        description: values.description,
      })
      message.success('项目已更新')
    } else {
      const project = await devRepo.createProject(values.name, values.description)
      setSelectedProjectId(project.id)
      message.success('项目已创建')
    }
    setProjectModalOpen(false)
    setEditingProject(null)
    projectForm.resetFields()
  }

  const saveTask = async () => {
    if (!selectedProject) return
    const values = await taskForm.validateFields()
    if (editingTask) {
      await devRepo.updateTask(editingTask.id, {
        title: values.title,
        priority: values.priority,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        note: values.note,
      })
      message.success('待办已更新')
    } else {
      await devRepo.createTask(
        selectedProject.id,
        values.title,
        values.priority,
        values.dueDate?.format('YYYY-MM-DD'),
      )
      message.success('待办已添加')
    }
    setTaskModalOpen(false)
    setEditingTask(null)
    taskForm.resetFields()
  }

  const saveBug = async () => {
    if (!selectedProject) return
    const values = await bugForm.validateFields()
    if (editingBug) {
      await devRepo.updateBug(editingBug.id, {
        title: values.title,
        severity: values.severity,
        repro: values.repro,
      })
      message.success('Bug 已更新')
    } else {
      const bug = await devRepo.createBug(selectedProject.id, values.title)
      await devRepo.updateBug(bug.id, {
        severity: values.severity,
        repro: values.repro,
      })
      message.success('Bug 已记录')
    }
    setBugModalOpen(false)
    setEditingBug(null)
    bugForm.resetFields()
  }

  const saveLog = async () => {
    if (!selectedProject) return
    const values = await logForm.validateFields()
    if (editingLog) {
      await devRepo.updateLog(editingLog.id, {
        content: values.content,
        date: values.date.format('YYYY-MM-DD'),
      })
      message.success('日志已更新')
    } else {
      await devRepo.createLog(selectedProject.id, values.date.format('YYYY-MM-DD'), values.content)
      message.success('日志已记录')
    }
    setLogModalOpen(false)
    setEditingLog(null)
    logForm.resetFields()
  }

  const saveMilestone = async () => {
    if (!selectedProject) return
    const values = await milestoneForm.validateFields()
    if (editingMilestone) {
      await devRepo.updateMilestone(editingMilestone.id, {
        name: values.name,
        targetDate: values.targetDate?.format('YYYY-MM-DD'),
        note: values.note,
      })
      message.success('里程碑已更新')
    } else {
      await devRepo.createMilestone(
        selectedProject.id,
        values.name,
        values.targetDate?.format('YYYY-MM-DD'),
      )
      message.success('里程碑已添加')
    }
    setMilestoneModalOpen(false)
    setEditingMilestone(null)
    milestoneForm.resetFields()
  }

  const openTaskForm = (task?: DevTask) => {
    setEditingTask(task ?? null)
    taskForm.setFieldsValue({
      title: task?.title ?? '',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ? dayjs(task.dueDate) : undefined,
      note: task?.note,
    })
    setTaskModalOpen(true)
  }

  const openProjectForm = (project?: DevProject) => {
    setEditingProject(project ?? null)
    projectForm.setFieldsValue({
      name: project?.name ?? '',
      description: project?.description,
    })
    setProjectModalOpen(true)
  }

  const openBugForm = (bug?: DevBug) => {
    setEditingBug(bug ?? null)
    bugForm.setFieldsValue({
      title: bug?.title ?? '',
      severity: bug?.severity ?? 'medium',
      repro: bug?.repro,
    })
    setBugModalOpen(true)
  }

  const openLogForm = (log?: DevLog) => {
    setEditingLog(log ?? null)
    logForm.setFieldsValue({
      content: log?.content ?? '',
      date: log ? dayjs(log.date) : dayjs(),
    })
    setLogModalOpen(true)
  }

  const openMilestoneForm = (milestone?: DevMilestone) => {
    setEditingMilestone(milestone ?? null)
    milestoneForm.setFieldsValue({
      name: milestone?.name ?? '',
      targetDate: milestone?.targetDate ? dayjs(milestone.targetDate) : undefined,
      note: milestone?.note,
    })
    setMilestoneModalOpen(true)
  }

  const projectHeader = selectedProject ? (
    <div className="dev-project-header">
      <div className="dev-project-title">
        <FolderKanban size={22} />
        <div>
          <h2>{selectedProject.name}</h2>
          <Typography.Text type="secondary">{selectedProject.description ?? '暂无项目说明'}</Typography.Text>
        </div>
      </div>
      <Space>
        <Select
          value={selectedProject.status}
          options={PROJECT_STATUS_OPTIONS}
          onChange={(value) => void devRepo.updateProject(selectedProject.id, { status: value })}
          style={{ width: 110 }}
        />
        <Tooltip title={selectedProject.archived ? '取消归档' : '归档项目'}>
          <Button
            icon={<Archive size={16} />}
            onClick={() => void devRepo.archiveProject(selectedProject.id, !selectedProject.archived)}
          >
            {selectedProject.archived ? '恢复' : '归档'}
          </Button>
        </Tooltip>
        <Popconfirm
          title="删除项目和该项目下的全部数据？"
          onConfirm={async () => {
            await devRepo.removeProject(selectedProject.id)
            setSelectedProjectId(undefined)
            message.success('项目已删除')
          }}
        >
          <Button danger icon={<Trash2 size={16} />} aria-label="删除项目" />
        </Popconfirm>
      </Space>
    </div>
  ) : null

  return (
    <>
      <PageHeader
        title="开发工作"
        description="管理项目、待办、Bug、日志和里程碑"
        action={
          <Space>
            <Button
              onClick={() => {
                setShowArchived(!showArchived)
              }}
            >
              {showArchived ? '隐藏已归档' : '显示已归档'}
            </Button>
            <Button
              data-testid="dev-add-project-button"
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setProjectModalOpen(true)}
            >
              新建项目
            </Button>
          </Space>
        }
      />

      {projects.length === 0 ? (
        <Empty
          style={{ padding: 70 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有开发项目"
        >
          <Button type="primary" onClick={() => setProjectModalOpen(true)}>
            创建第一个项目
          </Button>
        </Empty>
      ) : (
        <Row gutter={16}>
          <Col xs={24} xl={6}>
            <div className="surface dev-project-list">
              <div className="surface-section dev-list-heading">项目</div>
              <List
                size="small"
                dataSource={projects}
                renderItem={(project) => (
                  <List.Item
                    data-testid={`dev-project-${project.id}`}
                    className={selectedProject?.id === project.id ? 'dev-project-active' : ''}
                    onClick={() => setSelectedProjectId(project.id)}
                    actions={[
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<Pencil size={14} />}
                        aria-label="编辑项目"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedProjectId(project.id)
                          openProjectForm(project)
                        }}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space size={6}>
                          <span>{project.name}</span>
                          <Tag color={project.archived ? 'default' : 'blue'}>
                            {PROJECT_STATUS_OPTIONS.find((item) => item.value === project.status)
                              ?.label ?? project.status}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Col>
          <Col xs={24} xl={18}>
            {projectHeader ? (
              <div className="surface">
                {projectHeader}
                <Tabs
                  className="dev-tabs"
                  items={[
                    {
                      key: 'tasks',
                      label: (
                        <span>
                          <Code2 size={14} /> 待办 {openTasks.length}
                        </span>
                      ),
                      children: (
                        <>
                          <div className="dev-tab-actions">
                            <Button
                              data-testid="dev-add-task-button"
                              icon={<Plus size={15} />}
                              onClick={() => openTaskForm()}
                            >
                              新增待办
                            </Button>
                          </div>
                          {tasks.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有待办" />
                          ) : (
                            <List
                              dataSource={[...openTasks, ...doneTasks]}
                              renderItem={(task) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="today"
                                      type="link"
                                      size="small"
                                      icon={<CalendarPlus size={14} />}
                                      onClick={() =>
                                        void addDevTaskToToday(task.id, task.title).then(() =>
                                          message.success('已加入今日计划'),
                                        )
                                      }
                                    >
                                      今日
                                    </Button>,
                                    <Button
                                      key="edit"
                                      type="text"
                                      size="small"
                                      icon={<Pencil size={14} />}
                                      aria-label="编辑待办"
                                      onClick={() => openTaskForm(task)}
                                    />,
                                    <Popconfirm
                                      key="delete"
                                      title="删除待办？"
                                      onConfirm={() => void devRepo.removeTask(task.id)}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        aria-label="删除待办"
                                      />
                                    </Popconfirm>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Checkbox
                                          checked={task.status === 'done'}
                                          onChange={(event) =>
                                            void devRepo.setTaskDone(task.id, event.target.checked)
                                          }
                                        />
                                        <span className={task.status === 'done' ? 'is-done' : ''}>
                                          {task.title}
                                        </span>
                                        <Tag color={task.priority === 'high' ? 'red' : 'default'}>
                                          {PRIORITY_OPTIONS.find((item) => item.value === task.priority)
                                            ?.label}
                                        </Tag>
                                      </Space>
                                    }
                                    description={
                                      <Space>
                                        {task.status ? (
                                          <Tag>
                                            {TASK_STATUS_OPTIONS.find((item) => item.value === task.status)
                                              ?.label}
                                          </Tag>
                                        ) : null}
                                        {task.dueDate ? (
                                          <Typography.Text type="secondary">
                                            截止 {task.dueDate}
                                          </Typography.Text>
                                        ) : null}
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          )}
                        </>
                      ),
                    },
                    {
                      key: 'bugs',
                      label: (
                        <span>
                          <Bug size={14} /> Bug {openBugs.length}
                        </span>
                      ),
                      children: (
                        <>
                          <div className="dev-tab-actions">
                            <Button
                              data-testid="dev-add-bug-button"
                              icon={<Plus size={15} />}
                              onClick={() => openBugForm()}
                            >
                              新增 Bug
                            </Button>
                          </div>
                          {bugs.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有 Bug" />
                          ) : (
                            <List
                              dataSource={[...openBugs, ...doneBugs]}
                              renderItem={(bug) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="edit"
                                      type="text"
                                      size="small"
                                      icon={<Pencil size={14} />}
                                      aria-label="编辑 Bug"
                                      onClick={() => openBugForm(bug)}
                                    />,
                                    <Popconfirm
                                      key="delete"
                                      title="删除 Bug？"
                                      onConfirm={() => void devRepo.removeBug(bug.id)}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        aria-label="删除 Bug"
                                      />
                                    </Popconfirm>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Checkbox
                                          checked={bug.status === 'done'}
                                          onChange={(event) =>
                                            void devRepo.updateBug(bug.id, {
                                              status: event.target.checked ? 'done' : 'open',
                                            })
                                          }
                                        />
                                        <span className={bug.status === 'done' ? 'is-done' : ''}>
                                          {bug.title}
                                        </span>
                                        <Tag
                                          color={
                                            bug.severity === 'critical' || bug.severity === 'high'
                                              ? 'red'
                                              : 'orange'
                                          }
                                        >
                                          {BUG_SEVERITY_OPTIONS.find(
                                            (item) => item.value === bug.severity,
                                          )?.label}
                                        </Tag>
                                      </Space>
                                    }
                                    description={bug.repro}
                                  />
                                </List.Item>
                              )}
                            />
                          )}
                        </>
                      ),
                    },
                    {
                      key: 'logs',
                      label: (
                        <span>
                          <Logs size={14} /> 日志
                        </span>
                      ),
                      children: (
                        <>
                          <div className="dev-tab-actions">
                            <Button icon={<Plus size={15} />} onClick={() => openLogForm()}>
                              新增日志
                            </Button>
                          </div>
                          {logs.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有开发日志" />
                          ) : (
                            <List
                              dataSource={logs}
                              renderItem={(log) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="edit"
                                      type="text"
                                      size="small"
                                      icon={<Pencil size={14} />}
                                      aria-label="编辑日志"
                                      onClick={() => openLogForm(log)}
                                    />,
                                    <Popconfirm
                                      key="delete"
                                      title="删除日志？"
                                      onConfirm={() => void devRepo.removeLog(log.id)}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        aria-label="删除日志"
                                      />
                                    </Popconfirm>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={<Typography.Text type="secondary">{log.date}</Typography.Text>}
                                    description={<div style={{ whiteSpace: 'pre-wrap' }}>{log.content}</div>}
                                  />
                                </List.Item>
                              )}
                            />
                          )}
                        </>
                      ),
                    },
                    {
                      key: 'milestones',
                      label: (
                        <span>
                          <Flag size={14} /> 里程碑
                        </span>
                      ),
                      children: (
                        <>
                          <div className="dev-tab-actions">
                            <Button icon={<Plus size={15} />} onClick={() => openMilestoneForm()}>
                              新增里程碑
                            </Button>
                          </div>
                          {milestones.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有里程碑" />
                          ) : (
                            <List
                              dataSource={milestones}
                              renderItem={(milestone) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="edit"
                                      type="text"
                                      size="small"
                                      icon={<Pencil size={14} />}
                                      aria-label="编辑里程碑"
                                      onClick={() => openMilestoneForm(milestone)}
                                    />,
                                    <Popconfirm
                                      key="delete"
                                      title="删除里程碑？"
                                      onConfirm={() => void devRepo.removeMilestone(milestone.id)}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        aria-label="删除里程碑"
                                      />
                                    </Popconfirm>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <span>{milestone.name}</span>
                                        {milestone.targetDate ? (
                                          <Typography.Text type="secondary">
                                            {milestone.targetDate}
                                          </Typography.Text>
                                        ) : null}
                                        <Tag>{milestone.status === 'done' ? '已完成' : '计划中'}</Tag>
                                      </Space>
                                    }
                                    description={milestone.note}
                                  />
                                </List.Item>
                              )}
                            />
                          )}
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个项目" />
            )}
          </Col>
        </Row>
      )}

      <Modal
        open={projectModalOpen}
        title={editingProject ? '编辑项目' : '新建项目'}
        okText={editingProject ? '保存修改' : '创建项目'}
        cancelText="取消"
        onOk={() => void createProject()}
        onCancel={() => {
          setProjectModalOpen(false)
          setEditingProject(null)
          projectForm.resetFields()
        }}
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input data-testid="dev-project-name-input" />
          </Form.Item>
          <Form.Item name="description" label="项目简介">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={taskModalOpen}
        title={editingTask ? '编辑待办' : '新增待办'}
        okText={editingTask ? '保存修改' : '添加待办'}
        cancelText="取消"
        onOk={() => void saveTask()}
        onCancel={() => {
          setTaskModalOpen(false)
          setEditingTask(null)
          taskForm.resetFields()
        }}
      >
        <Form form={taskForm} layout="vertical" initialValues={{ priority: 'medium' }}>
          <Form.Item name="title" label="待办内容" rules={[{ required: true, message: '请输入待办内容' }]}>
            <Input data-testid="dev-task-title-input" />
          </Form.Item>
          <Space size={14}>
            <Form.Item name="priority" label="优先级">
              <Select options={PRIORITY_OPTIONS} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="dueDate" label="截止日期">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={bugModalOpen}
        title={editingBug ? '编辑 Bug' : '新增 Bug'}
        okText={editingBug ? '保存修改' : '添加 Bug'}
        cancelText="取消"
        onOk={() => void saveBug()}
        onCancel={() => {
          setBugModalOpen(false)
          setEditingBug(null)
          bugForm.resetFields()
        }}
      >
        <Form form={bugForm} layout="vertical" initialValues={{ severity: 'medium' }}>
          <Form.Item name="title" label="Bug 标题" rules={[{ required: true, message: '请输入 Bug 标题' }]}>
            <Input data-testid="dev-bug-title-input" />
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select options={BUG_SEVERITY_OPTIONS} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="repro" label="复现说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={logModalOpen}
        title={editingLog ? '编辑日志' : '新增日志'}
        okText={editingLog ? '保存修改' : '记录日志'}
        cancelText="取消"
        onOk={() => void saveLog()}
        onCancel={() => {
          setLogModalOpen(false)
          setEditingLog(null)
          logForm.resetFields()
        }}
      >
        <Form form={logForm} layout="vertical" initialValues={{ date: dayjs() }}>
          <Form.Item name="date" label="日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="content" label="日志内容" rules={[{ required: true, message: '请输入日志内容' }]}>
            <Input.TextArea rows={5} data-testid="dev-log-content-input" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={milestoneModalOpen}
        title={editingMilestone ? '编辑里程碑' : '新增里程碑'}
        okText={editingMilestone ? '保存修改' : '添加里程碑'}
        cancelText="取消"
        onOk={() => void saveMilestone()}
        onCancel={() => {
          setMilestoneModalOpen(false)
          setEditingMilestone(null)
          milestoneForm.resetFields()
        }}
      >
        <Form form={milestoneForm} layout="vertical">
          <Form.Item name="name" label="里程碑名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input data-testid="dev-milestone-name-input" />
          </Form.Item>
          <Form.Item name="targetDate" label="目标日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
