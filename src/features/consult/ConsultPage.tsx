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
  Tabs,
  Tag,
  Typography,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  CalendarPlus,
  Contact,
  MessagesSquare,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { addConsultToToday } from '@/data/planLink'
import { consultRepo } from '@/data/repositories/consult'
import type {
  Client,
  ConsultFollowUp,
  ConsultSession,
  ConsultSettlement,
  SettlementStatus,
} from '@/domain/types'

interface ClientFormValues {
  name: string
  contact?: string
  note?: string
  nextFollowUpDate?: Dayjs
}

interface SessionFormValues {
  date: Dayjs
  topic?: string
  keyPoints?: string
  nextStep?: string
  createFollowUp: boolean
  followUpDate?: Dayjs
}

interface FollowUpFormValues {
  content: string
  dueDate?: Dayjs
}

interface SettlementFormValues {
  date: Dayjs
  quantity?: number
  amount?: number
  status: SettlementStatus
  note?: string
}

const SETTLEMENT_STATUS_OPTIONS = [
  { label: '未结算', value: 'unpaid' },
  { label: '已结算', value: 'paid' },
  { label: '已豁免', value: 'waived' },
]

export function ConsultPage() {
  const { message } = App.useApp()
  const [selectedClientId, setSelectedClientId] = useState<string>()
  const [searchText, setSearchText] = useState('')
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<ConsultFollowUp | null>(null)
  const [settlementModalOpen, setSettlementModalOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<ConsultSettlement | null>(null)
  const [clientForm] = Form.useForm<ClientFormValues>()
  const [sessionForm] = Form.useForm<SessionFormValues>()
  const [followUpForm] = Form.useForm<FollowUpFormValues>()
  const [settlementForm] = Form.useForm<SettlementFormValues>()

  const clients = useLiveQuery<Client[], Client[]>(() => consultRepo.listClients(), [], [])
  const selectedClient = useLiveQuery<Client | undefined>(
    async () => {
      if (selectedClientId) return consultRepo.getClient(selectedClientId)
      return clients[0]
    },
    [clients, selectedClientId],
  )
  const sessions = useLiveQuery<ConsultSession[], ConsultSession[]>(
    () => (selectedClient?.id ? consultRepo.listSessions(selectedClient.id) : Promise.resolve([])),
    [selectedClient],
    [],
  )
  const followUps = useLiveQuery<ConsultFollowUp[], ConsultFollowUp[]>(
    () =>
      selectedClient?.id ? consultRepo.listFollowUps(selectedClient.id) : Promise.resolve([]),
    [selectedClient],
    [],
  )
  const settlements = useLiveQuery<ConsultSettlement[], ConsultSettlement[]>(
    () =>
      selectedClient?.id ? consultRepo.listSettlements(selectedClient.id) : Promise.resolve([]),
    [selectedClient],
    [],
  )

  const visibleClients = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return clients
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(keyword) ||
        client.contact?.toLowerCase().includes(keyword) ||
        client.note?.toLowerCase().includes(keyword),
    )
  }, [clients, searchText])

  const openClientForm = (client?: Client) => {
    setEditingClient(client ?? null)
    clientForm.setFieldsValue({
      name: client?.name ?? '',
      contact: client?.contact,
      note: client?.note,
      nextFollowUpDate: client?.nextFollowUpDate ? dayjs(client.nextFollowUpDate) : undefined,
    })
    setClientModalOpen(true)
  }

  const saveClient = async () => {
    const values = await clientForm.validateFields()
    if (editingClient) {
      await consultRepo.updateClient(editingClient.id, {
        name: values.name,
        contact: values.contact,
        note: values.note,
        nextFollowUpDate: values.nextFollowUpDate?.format('YYYY-MM-DD'),
      })
      message.success('客户资料已更新')
    } else {
      const client = await consultRepo.createClient(values.name, values.contact, values.note)
      if (values.nextFollowUpDate) {
        await consultRepo.updateClient(client.id, {
          nextFollowUpDate: values.nextFollowUpDate.format('YYYY-MM-DD'),
        })
      }
      setSelectedClientId(client.id)
      message.success('客户已创建')
    }
    setClientModalOpen(false)
    setEditingClient(null)
    clientForm.resetFields()
  }

  const saveSession = async () => {
    if (!selectedClient) return
    const values = await sessionForm.validateFields()
    const session = await consultRepo.createSession(selectedClient.id, {
      date: values.date.format('YYYY-MM-DD'),
      topic: values.topic,
      keyPoints: values.keyPoints,
      nextStep: values.nextStep,
    })
    if (values.nextStep?.trim() && values.createFollowUp) {
      await consultRepo.createFollowUp(
        selectedClient.id,
        values.nextStep.trim(),
        (values.followUpDate ?? values.date).format('YYYY-MM-DD'),
        session.id,
      )
      await consultRepo.updateClient(selectedClient.id, {
        nextFollowUpDate: (values.followUpDate ?? values.date).format('YYYY-MM-DD'),
      })
      message.success('咨询记录和跟进待办已保存')
    } else {
      message.success('咨询记录已保存')
    }
    setSessionModalOpen(false)
    sessionForm.resetFields()
  }

  const openFollowUpForm = (followUp?: ConsultFollowUp) => {
    setEditingFollowUp(followUp ?? null)
    followUpForm.setFieldsValue({
      content: followUp?.content ?? '',
      dueDate: followUp?.dueDate ? dayjs(followUp.dueDate) : undefined,
    })
    setFollowUpModalOpen(true)
  }

  const saveFollowUp = async () => {
    if (!selectedClient) return
    const values = await followUpForm.validateFields()
    if (editingFollowUp) {
      await consultRepo.updateFollowUp(editingFollowUp.id, {
        content: values.content,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
      })
      message.success('跟进事项已更新')
    } else {
      await consultRepo.createFollowUp(
        selectedClient.id,
        values.content,
        values.dueDate?.format('YYYY-MM-DD'),
      )
      message.success('跟进事项已添加')
    }
    setFollowUpModalOpen(false)
    setEditingFollowUp(null)
    followUpForm.resetFields()
  }

  const openSettlementForm = (settlement?: ConsultSettlement) => {
    setEditingSettlement(settlement ?? null)
    settlementForm.setFieldsValue({
      date: settlement ? dayjs(settlement.date) : dayjs(),
      quantity: settlement?.quantity,
      amount: settlement?.amount,
      status: settlement?.status ?? 'unpaid',
      note: settlement?.note,
    })
    setSettlementModalOpen(true)
  }

  const saveSettlement = async () => {
    if (!selectedClient) return
    const values = await settlementForm.validateFields()
    if (editingSettlement) {
      await consultRepo.updateSettlement(editingSettlement.id, {
        date: values.date.format('YYYY-MM-DD'),
        quantity: values.quantity,
        amount: values.amount,
        status: values.status,
        note: values.note,
      })
      message.success('结算记录已更新')
    } else {
      await consultRepo.createSettlement(
        selectedClient.id,
        values.date.format('YYYY-MM-DD'),
        values.amount,
        values.quantity,
      ).then((settlement) =>
        consultRepo.updateSettlement(settlement.id, {
          status: values.status,
          note: values.note,
        }),
      )
      message.success('结算记录已添加')
    }
    setSettlementModalOpen(false)
    setEditingSettlement(null)
    settlementForm.resetFields()
  }

  const openSessions = sessions
  const openFollowUps = followUps.filter((item) => item.status === 'open')
  const doneFollowUps = followUps.filter((item) => item.status === 'done')

  return (
    <>
      <PageHeader
        title="咨询工作"
        description="管理客户、咨询记录、跟进和结算"
        action={
          <Button
            data-testid="consult-add-client-button"
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => openClientForm()}
          >
            新建客户
          </Button>
        }
      />

      {clients.length === 0 ? (
        <Empty
          style={{ padding: 70 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有客户资料"
        >
          <Button type="primary" onClick={() => openClientForm()}>
            创建第一位客户
          </Button>
        </Empty>
      ) : (
        <Row gutter={16}>
          <Col xs={24} xl={7}>
            <div className="surface consult-client-list">
              <div className="surface-section">
                <Input
                  data-testid="consult-client-search"
                  prefix={<Contact size={15} />}
                  placeholder="搜索客户"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  allowClear
                />
              </div>
              <List
                size="small"
                dataSource={visibleClients}
                renderItem={(client) => (
                  <List.Item
                    data-testid={`consult-client-${client.id}`}
                    className={selectedClient?.id === client.id ? 'consult-client-active' : ''}
                    onClick={() => setSelectedClientId(client.id)}
                    actions={[
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<Pencil size={14} />}
                        aria-label="编辑客户"
                        onClick={(event) => {
                          event.stopPropagation()
                          openClientForm(client)
                        }}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={<span>{client.name}</span>}
                      description={
                        client.nextFollowUpDate ? (
                          <Typography.Text type={dayjs(client.nextFollowUpDate).isBefore(dayjs(), 'day') ? 'danger' : 'secondary'}>
                            下次跟进 {client.nextFollowUpDate}
                          </Typography.Text>
                        ) : (
                          '暂无跟进安排'
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Col>
          <Col xs={24} xl={17}>
            {selectedClient ? (
              <div className="surface">
                <div className="consult-header">
                  <div className="consult-header-title">
                    <UserRound size={22} color="#b45309" />
                    <div>
                      <h2>{selectedClient.name}</h2>
                      <Typography.Text type="secondary">
                        {selectedClient.contact || '未填写联系方式'}
                      </Typography.Text>
                    </div>
                  </div>
                  <Space>
                    <Button icon={<MessagesSquare size={15} />} onClick={() => {
                      sessionForm.setFieldsValue({
                        date: dayjs(),
                        createFollowUp: true,
                        followUpDate: dayjs().add(7, 'day'),
                      })
                      setSessionModalOpen(true)
                    }}>
                      记录咨询
                    </Button>
                    <Popconfirm
                      title="删除客户和全部相关记录？"
                      onConfirm={async () => {
                        await consultRepo.removeClient(selectedClient.id)
                        setSelectedClientId(undefined)
                        message.success('客户已删除')
                      }}
                    >
                      <Button danger icon={<Trash2 size={15} />} aria-label="删除客户" />
                    </Popconfirm>
                  </Space>
                </div>
                <Tabs
                  className="consult-tabs"
                  items={[
                    {
                      key: 'sessions',
                      label: <span><MessagesSquare size={14} /> 咨询记录</span>,
                      children: sessions.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有咨询记录" />
                      ) : (
                        <List
                          dataSource={openSessions}
                          renderItem={(session) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Tag color="orange">{session.date}</Tag>
                                    <span>{session.topic || '未填写主题'}</span>
                                  </Space>
                                }
                                description={
                                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                    {session.keyPoints ? (
                                      <div style={{ whiteSpace: 'pre-wrap' }}>{session.keyPoints}</div>
                                    ) : null}
                                    {session.nextStep ? (
                                      <Typography.Text type="secondary">
                                        下一步：{session.nextStep}
                                      </Typography.Text>
                                    ) : null}
                                  </Space>
                                }
                              />
                              <Popconfirm
                                title="删除这条咨询记录？"
                                onConfirm={() => void consultRepo.removeSession(session.id)}
                              >
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<Trash2 size={14} />}
                                  aria-label="删除咨询记录"
                                />
                              </Popconfirm>
                            </List.Item>
                          )}
                        />
                      ),
                    },
                    {
                      key: 'follow-ups',
                      label: <span><Phone size={14} /> 跟进待办 {openFollowUps.length}</span>,
                      children: (
                        <>
                          <div className="consult-tab-actions">
                            <Button icon={<Plus size={15} />} onClick={() => openFollowUpForm()}>
                              新增跟进
                            </Button>
                          </div>
                          <List
                            dataSource={[...openFollowUps, ...doneFollowUps]}
                            renderItem={(followUp) => (
                              <List.Item
                                actions={[
                                  followUp.status === 'open' ? (
                                    <Button
                                      key="today"
                                      type="link"
                                      size="small"
                                      icon={<CalendarPlus size={14} />}
                                      onClick={() =>
                                        void addConsultToToday(followUp.id, followUp.content).then(
                                          () => message.success('已加入今日计划'),
                                        )
                                      }
                                    >
                                      今日
                                    </Button>
                                  ) : null,
                                  <Button
                                    key="edit"
                                    type="text"
                                    size="small"
                                    icon={<Pencil size={14} />}
                                    aria-label="编辑跟进"
                                    onClick={() => openFollowUpForm(followUp)}
                                  />,
                                  <Popconfirm
                                    key="delete"
                                    title="删除跟进事项？"
                                    onConfirm={() => void consultRepo.removeFollowUp(followUp.id)}
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<Trash2 size={14} />}
                                      aria-label="删除跟进"
                                    />
                                  </Popconfirm>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={
                                    <Space>
                                      <Checkbox
                                        checked={followUp.status === 'done'}
                                        onChange={(event) =>
                                          void consultRepo.setFollowUpDone(
                                            followUp.id,
                                            event.target.checked,
                                          )
                                        }
                                      />
                                      <span className={followUp.status === 'done' ? 'is-done' : ''}>
                                        {followUp.content}
                                      </span>
                                    </Space>
                                  }
                                  description={
                                    followUp.dueDate ? `截止 ${followUp.dueDate}` : '未设截止日期'
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </>
                      ),
                    },
                    {
                      key: 'settlements',
                      label: <span><Receipt size={14} /> 结算记录</span>,
                      children: (
                        <>
                          <div className="consult-tab-actions">
                            <Button icon={<Plus size={15} />} onClick={() => openSettlementForm()}>
                              新增结算
                            </Button>
                          </div>
                          {settlements.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有结算记录" />
                          ) : (
                            <List
                              dataSource={settlements}
                              renderItem={(settlement) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="edit"
                                      type="text"
                                      size="small"
                                      icon={<Pencil size={14} />}
                                      aria-label="编辑结算"
                                      onClick={() => openSettlementForm(settlement)}
                                    />,
                                    <Popconfirm
                                      key="delete"
                                      title="删除结算记录？"
                                      onConfirm={() => void consultRepo.removeSettlement(settlement.id)}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        aria-label="删除结算"
                                      />
                                    </Popconfirm>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <Tag>{settlement.date}</Tag>
                                        <span>
                                          {settlement.amount
                                            ? `${settlement.amount} 元`
                                            : '未填写金额'}
                                        </span>
                                        <Tag
                                          color={
                                            settlement.status === 'paid'
                                              ? 'green'
                                              : settlement.status === 'waived'
                                                ? 'default'
                                                : 'orange'
                                          }
                                        >
                                          {SETTLEMENT_STATUS_OPTIONS.find(
                                            (item) => item.value === settlement.status,
                                          )?.label}
                                        </Tag>
                                      </Space>
                                    }
                                    description={settlement.note}
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
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个客户" />
            )}
          </Col>
        </Row>
      )}

      <Modal
        open={clientModalOpen}
        title={editingClient ? '编辑客户' : '新建客户'}
        okText={editingClient ? '保存修改' : '创建客户'}
        cancelText="取消"
        onOk={() => void saveClient()}
        onCancel={() => {
          setClientModalOpen(false)
          setEditingClient(null)
          clientForm.resetFields()
        }}
      >
        <Form form={clientForm} layout="vertical">
          <Form.Item name="name" label="称呼或姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input data-testid="consult-client-name-input" />
          </Form.Item>
          <Form.Item name="contact" label="联系方式">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="nextFollowUpDate" label="下次跟进日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={sessionModalOpen}
        title="记录咨询"
        okText="保存记录"
        cancelText="取消"
        onOk={() => void saveSession()}
        onCancel={() => {
          setSessionModalOpen(false)
          sessionForm.resetFields()
        }}
        width={620}
      >
        <Form form={sessionForm} layout="vertical" initialValues={{ date: dayjs(), createFollowUp: true }}>
          <Form.Item name="date" label="咨询日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="topic" label="咨询主题">
            <Input data-testid="consult-session-topic-input" />
          </Form.Item>
          <Form.Item name="keyPoints" label="咨询要点">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="nextStep" label="下一步">
            <Input.TextArea data-testid="consult-session-next-step-input" rows={2} />
          </Form.Item>
          <Space size={20}>
            <Form.Item name="createFollowUp" label="生成跟进待办" valuePropName="checked">
              <Checkbox />
            </Form.Item>
            <Form.Item name="followUpDate" label="跟进截止日期">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={followUpModalOpen}
        title={editingFollowUp ? '编辑跟进' : '新增跟进'}
        okText={editingFollowUp ? '保存修改' : '添加跟进'}
        cancelText="取消"
        onOk={() => void saveFollowUp()}
        onCancel={() => {
          setFollowUpModalOpen(false)
          setEditingFollowUp(null)
          followUpForm.resetFields()
        }}
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea data-testid="consult-followup-content-input" rows={3} />
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={settlementModalOpen}
        title={editingSettlement ? '编辑结算' : '新增结算'}
        okText={editingSettlement ? '保存修改' : '添加结算'}
        cancelText="取消"
        onOk={() => void saveSettlement()}
        onCancel={() => {
          setSettlementModalOpen(false)
          setEditingSettlement(null)
          settlementForm.resetFields()
        }}
      >
        <Form form={settlementForm} layout="vertical" initialValues={{ status: 'unpaid' }}>
          <Form.Item name="date" label="日期">
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Space size={14}>
            <Form.Item name="quantity" label="次数/时长">
              <InputNumber min={0} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="amount" label="金额">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={SETTLEMENT_STATUS_OPTIONS} style={{ width: 120 }} />
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
