import { App, Input, Modal, Select, Segmented, Space } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { consultRepo } from '@/data/repositories/consult'
import { devRepo } from '@/data/repositories/dev'
import { dietRepo } from '@/data/repositories/diet'
import { fitnessRepo } from '@/data/repositories/fitness'
import { gamesRepo } from '@/data/repositories/games'
import { mediaRepo } from '@/data/repositories/media'
import { memoRepo } from '@/data/repositories/memos'
import { planRepo } from '@/data/repositories/plan'
import { useUiStore } from '@/stores/uiStore'
import { todayKey } from '@/utils/date'

type CaptureType = 'memo' | 'task' | 'media' | 'dev' | 'consult' | 'fitness' | 'diet' | 'game'

const CAPTURE_OPTIONS: Array<{ label: string; value: CaptureType }> = [
  { label: '备忘', value: 'memo' },
  { label: '今日任务', value: 'task' },
  { label: '自媒体选题', value: 'media' },
  { label: '开发待办', value: 'dev' },
  { label: '咨询跟进', value: 'consult' },
  { label: '训练计划', value: 'fitness' },
  { label: '饮食记录', value: 'diet' },
  { label: '游戏', value: 'game' },
]

export function QuickCaptureModal() {
  const open = useUiStore((state) => state.quickCaptureOpen)
  const setOpen = useUiStore((state) => state.setQuickCaptureOpen)
  const { message } = App.useApp()
  const [type, setType] = useState<CaptureType>('memo')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [projectId, setProjectId] = useState<string>()
  const [clientId, setClientId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const projects = useLiveQuery(() => devRepo.listProjects(), [], [])
  const clients = useLiveQuery(() => consultRepo.listClients(), [], [])

  const close = () => {
    if (saving) return
    setContent('')
    setType('memo')
    setPriority('medium')
    setProjectId(undefined)
    setClientId(undefined)
    setOpen(false)
  }

  const save = async () => {
    const value = content.trim()
    if (!value) {
      message.warning('先写点内容')
      return
    }
    setSaving(true)
    try {
      switch (type) {
        case 'memo':
          await memoRepo.create(value)
          message.success('备忘已保存')
          break
        case 'task':
          await planRepo.create({
            date: todayKey(),
            kind: 'todo',
            title: value,
            priority,
            sourceType: 'manual',
          })
          message.success('今日任务已添加')
          break
        case 'media':
          await mediaRepo.createContent({ title: value.slice(0, 120), status: 'idea' })
          message.success('自媒体选题已记录')
          break
        case 'dev': {
          let targetProjectId = projectId ?? projects[0]?.id
          if (!targetProjectId) {
            targetProjectId = (await devRepo.createProject('快速备忘收集')).id
          }
          await devRepo.createTask(targetProjectId, value, priority)
          message.success('开发待办已添加')
          break
        }
        case 'consult': {
          let targetClientId = clientId ?? clients[0]?.id
          if (!targetClientId) {
            targetClientId = (await consultRepo.createClient('快速跟进客户')).id
          }
          await consultRepo.createFollowUp(targetClientId, value)
          message.success('咨询跟进已添加')
          break
        }
        case 'fitness':
          await fitnessRepo.createPlan(value, [dayjs().day()])
          message.success('训练计划已创建，可稍后补充动作')
          break
        case 'diet':
          await dietRepo.addItem(todayKey(), 'snack', value)
          message.success('已加入今日加餐')
          break
        case 'game':
          await gamesRepo.createGame(value)
          message.success('游戏已加入游戏库')
          break
      }
      close()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="快速记录"
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      onOk={save}
      onCancel={close}
      destroyOnHidden
      width={540}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Segmented
          value={type}
          onChange={(value) => setType(value as CaptureType)}
          options={CAPTURE_OPTIONS}
          block
        />
        <Input.TextArea
          data-testid="quick-capture-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          autoFocus
          rows={4}
          placeholder="写下一个想法、任务或记录"
          maxLength={1000}
          showCount
        />
        <Space wrap>
          {type === 'task' || type === 'dev' ? (
            <Select
              data-testid="quick-capture-priority"
              value={priority}
              onChange={setPriority}
              options={[
                { label: '高优先级', value: 'high' },
                { label: '中优先级', value: 'medium' },
                { label: '低优先级', value: 'low' },
              ]}
              style={{ width: 150 }}
            />
          ) : null}
          {type === 'dev' ? (
            <Select
              data-testid="quick-capture-project"
              value={projectId ?? projects[0]?.id}
              options={projects.map((project) => ({ label: project.name, value: project.id }))}
              onChange={setProjectId}
              placeholder="选择项目"
              style={{ width: 190 }}
            />
          ) : null}
          {type === 'consult' ? (
            <Select
              data-testid="quick-capture-client"
              value={clientId ?? clients[0]?.id}
              options={clients.map((client) => ({ label: client.name, value: client.id }))}
              onChange={setClientId}
              placeholder="选择客户"
              style={{ width: 190 }}
            />
          ) : null}
        </Space>
      </Space>
    </Modal>
  )
}
