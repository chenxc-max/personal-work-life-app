import { App, Modal, Select, Space, Typography } from 'antd'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { convertMemo } from '@/data/planLink'
import { consultRepo } from '@/data/repositories/consult'
import { devRepo } from '@/data/repositories/dev'
import { mediaRepo } from '@/data/repositories/media'
import { planRepo } from '@/data/repositories/plan'
import type { Memo, SourceType } from '@/domain/types'
import { todayKey } from '@/utils/date'

interface MemoConvertModalProps {
  memo: Memo | null
  open: boolean
  onClose: () => void
}

const CONVERT_OPTIONS = [
  {
    value: 'plan',
    label: '转为今日任务',
    targetType: 'manual' as SourceType,
    convert: async (content: string) => {
      const item = await planRepo.create({
        date: todayKey(),
        kind: 'todo',
        title: content,
        sourceType: 'manual',
      })
      return { id: item.id, label: '今日任务' }
    },
  },
  {
    value: 'media',
    label: '转为自媒体选题',
    targetType: 'media' as SourceType,
    convert: async (content: string) => {
      const item = await mediaRepo.createContent({
        title: content.slice(0, 120),
        status: 'idea',
      })
      return { id: item.id, label: '自媒体选题' }
    },
  },
  {
    value: 'dev',
    label: '转为开发待办',
    targetType: 'dev' as SourceType,
    convert: async (content: string, projectId?: string) => {
      let targetProjectId = projectId
      if (!targetProjectId) {
        const projects = await devRepo.listProjects()
        targetProjectId = projects[0]?.id
        if (!targetProjectId) {
          const project = await devRepo.createProject('快速备忘收集')
          targetProjectId = project.id
        }
      }
      const item = await devRepo.createTask(targetProjectId, content)
      return { id: item.id, label: '开发待办' }
    },
  },
  {
    value: 'consult',
    label: '转为咨询跟进',
    targetType: 'consult' as SourceType,
    convert: async (content: string, clientId?: string) => {
      let targetClientId = clientId
      if (!targetClientId) {
        const clients = await consultRepo.listClients()
        targetClientId = clients[0]?.id
        if (!targetClientId) {
          const client = await consultRepo.createClient('快速跟进客户')
          targetClientId = client.id
        }
      }
      const item = await consultRepo.createFollowUp(targetClientId, content)
      return { id: item.id, label: '咨询跟进' }
    },
  },
]

export function MemoConvertModal({ memo, open, onClose }: MemoConvertModalProps) {
  const { message } = App.useApp()
  const [target, setTarget] = useState('plan')
  const [projectId, setProjectId] = useState<string>()
  const [clientId, setClientId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const projects = useLiveQuery(() => devRepo.listProjects(), [], [])
  const clients = useLiveQuery(() => consultRepo.listClients(), [], [])

  const close = () => {
    if (saving) return
    setTarget('plan')
    onClose()
  }

  const convert = async () => {
    if (!memo) return
    const option = CONVERT_OPTIONS.find((item) => item.value === target)
    if (!option) return
    setSaving(true)
    try {
      const contextId = target === 'dev' ? projectId : target === 'consult' ? clientId : undefined
      const result = await option.convert(memo.content, contextId)
      await convertMemo(memo.id, option.targetType, result.id, result.label)
      message.success(`已转为${result.label}`)
      close()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="归类备忘"
      okText="确认转换"
      cancelText="取消"
      confirmLoading={saving}
      onOk={convert}
      onCancel={close}
      width={500}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Typography.Paragraph style={{ margin: 0 }}>{memo?.content}</Typography.Paragraph>
        <Select
          value={target}
          options={CONVERT_OPTIONS}
          onChange={setTarget}
          style={{ width: 240 }}
          suffixIcon={<ArrowRight size={16} />}
        />
        {target === 'dev' ? (
          <Select
            value={projectId ?? projects[0]?.id}
            options={projects.map((project) => ({ label: project.name, value: project.id }))}
            onChange={setProjectId}
            placeholder="选择项目"
            style={{ width: 240 }}
          />
        ) : null}
        {target === 'consult' ? (
          <Select
            value={clientId ?? clients[0]?.id}
            options={clients.map((client) => ({ label: client.name, value: client.id }))}
            onChange={setClientId}
            placeholder="选择客户"
            style={{ width: 240 }}
          />
        ) : null}
        <Typography.Text type="secondary">转换后这条备忘会标记为已归类。</Typography.Text>
      </Space>
    </Modal>
  )
}
