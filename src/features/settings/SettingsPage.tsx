import {
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Input,
  List,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd'
import { ArrowDown, ArrowUp, Download, Import, RotateCcw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  clearAllData,
  clearModule,
  exportBackupJson,
  listRollbackPoints,
  recordManualBackup,
  restoreBackupFile,
  restoreRollbackPoint,
  validateBackupFile,
} from '@/data/backup'
import { getDataOverview, type ModuleOverview } from '@/data/overview'
import { settingsRepo } from '@/data/repositories/settings'
import { PageHeader } from '@/components/PageHeader'
import type { BackupFile, BackupRecord } from '@/domain/types'

const ROUTE_OPTIONS = [
  { label: '首页总览', value: '/home' },
  { label: '今日计划', value: '/plan' },
  { label: '自媒体', value: '/media' },
  { label: '开发工作', value: '/dev' },
  { label: '咨询工作', value: '/consult' },
  { label: '健身计划', value: '/fitness' },
  { label: '饮食计划', value: '/diet' },
  { label: '游戏娱乐', value: '/games' },
]

const MODULE_OPTIONS = [
  { label: '快速备忘', value: 'memos' },
  { label: '今日计划', value: 'plan' },
  { label: '自媒体', value: 'media' },
  { label: '开发工作', value: 'dev' },
  { label: '咨询工作', value: 'consult' },
  { label: '健身计划', value: 'fitness' },
  { label: '饮食计划', value: 'diet' },
  { label: '游戏娱乐', value: 'games' },
]

export function SettingsPage() {
  const { message, modal } = App.useApp()
  const settings = useLiveQuery(() => settingsRepo.get(), [], undefined)
  const overview = useLiveQuery<ModuleOverview[], ModuleOverview[]>(
    () => getDataOverview(),
    [],
    [],
  )
  const rollbackPoints = useLiveQuery<BackupRecord[], BackupRecord[]>(
    () => listRollbackPoints(),
    [],
    [],
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null)
  const [clearModuleName, setClearModuleName] = useState('plan')
  const [importPreviewOpen, setImportPreviewOpen] = useState(false)

  const exportBackup = async () => {
    const json = await exportBackupJson()
    const fileName = `工作生活备份-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
    await recordManualBackup(fileName)
    message.success('备份已导出')
  }

  const chooseImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const backup = await validateBackupFile(parsed)
      setPendingBackup(backup)
      setImportPreviewOpen(true)
    } catch {
      message.error('文件不是有效备份，未修改现有数据')
    }
  }

  const doRestore = async () => {
    if (!pendingBackup) return
    await restoreBackupFile(pendingBackup)
    setPendingBackup(null)
    setImportPreviewOpen(false)
    message.success('备份已恢复')
  }

  const doClearModule = async (value: string) => {
    const run = async () => {
      await clearModule(value)
      message.success('所选模块数据已清空')
    }
    modal.confirm({
      title: '确认清空这个模块？',
      content: '清空后当前模块记录将被删除，单条记录无法撤销。',
      okText: '继续',
      cancelText: '取消',
      onOk: () =>
        new Promise<void>((resolve) => {
          modal.confirm({
            title: '再次确认',
            content: '这是最终确认，确认后不可恢复。',
            okText: '确认清空',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: async () => {
              await run()
              resolve()
            },
            onCancel: () => resolve(),
          })
        }),
    })
  }

  const doClearAll = () => {
    modal.confirm({
      title: '确认清空全部数据？',
      content: '所有模块、今日计划和偏好都会被删除。建议先导出备份。',
      okText: '继续',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () =>
        new Promise<void>((resolve) => {
          modal.confirm({
            title: '最终确认清空全部数据',
            content: '这是不可恢复操作。确认后无法撤销。',
            okText: '确认清空',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: async () => {
              await clearAllData()
              message.success('全部数据已清空')
              resolve()
            },
            onCancel: () => resolve(),
          })
        }),
    })
  }

  const changeDefaultRoute = async (value: string) => {
    await settingsRepo.update({ defaultRoute: value })
    message.success('默认打开页已更新')
  }

  const updateHomeSection = async (
    key: string,
    patch: { visible?: boolean; order?: number },
  ) => {
    if (!settings) return
    const sections = settings.homeSections.map((section) =>
      section.key === key ? { ...section, ...patch } : section,
    )
    await settingsRepo.update({ homeSections: sections })
  }

  const moveHomeSection = async (key: string, delta: number) => {
    if (!settings) return
    const sorted = [...settings.homeSections].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((section) => section.key === key)
    const targetIndex = index + delta
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return
    const next = [...sorted]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    await settingsRepo.update({
      homeSections: next.map((section, order) => ({ ...section, order })),
    })
  }

  const restoreRollback = async (id: string) => {
    await restoreRollbackPoint(id)
    message.success('已恢复到导入前状态')
  }

  return (
    <>
      <PageHeader
        title="数据与设置"
        description="管理本机数据、备份恢复和基础偏好"
        action={
          <Button data-testid="export-backup-button" icon={<Download size={16} />} onClick={exportBackup}>
            导出备份
          </Button>
        }
      />

      <div style={{ display: 'grid', gap: 16, maxWidth: 960 }}>
        <Card title="数据备份与恢复" size="small">
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              备份是单个 JSON 文件，可以保存到电脑任意位置。恢复前会先保存当前数据回滚点。
            </Typography.Text>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: 'last-backup',
                  label: '最近备份',
                  children: settings?.lastBackupAt
                    ? new Date(settings.lastBackupAt).toLocaleString('zh-CN')
                    : '还没有导出过备份',
                },
              ]}
            />
            <Space wrap>
              <Button
                data-testid="export-backup-secondary"
                icon={<Download size={16} />}
                onClick={exportBackup}
              >
                导出完整备份
              </Button>
              <Button
                data-testid="import-backup-button"
                icon={<Import size={16} />}
                onClick={() => fileInputRef.current?.click()}
              >
                导入备份
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                data-testid="import-backup-input"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void chooseImport(file)
                  event.target.value = ''
                }}
              />
            </Space>
          </Space>
        </Card>

        <Card title="首页摘要配置" size="small">
          <List
            size="small"
            dataSource={[...(settings?.homeSections ?? [])].sort((a, b) => a.order - b.order)}
            renderItem={(section) => (
              <List.Item
                actions={[
                  <Button
                    key="up"
                    type="text"
                    size="small"
                    icon={<ArrowUp size={14} />}
                    aria-label={`上移 ${section.title}`}
                    onClick={() => void moveHomeSection(section.key, -1)}
                  />,
                  <Button
                    key="down"
                    type="text"
                    size="small"
                    icon={<ArrowDown size={14} />}
                    aria-label={`下移 ${section.title}`}
                    onClick={() => void moveHomeSection(section.key, 1)}
                  />,
                ]}
              >
                <Checkbox
                  checked={section.visible}
                  onChange={(event) =>
                    void updateHomeSection(section.key, { visible: event.target.checked })
                  }
                >
                  {section.title}
                </Checkbox>
              </List.Item>
            )}
          />
        </Card>

        <Card title="数据概览" size="small">
          <List
            size="small"
            dataSource={overview}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.label} · ${item.count} 条`}
                  description={
                    item.updatedAt
                      ? `最近更新 ${new Date(item.updatedAt).toLocaleString('zh-CN')}`
                      : '暂无数据'
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="导入回滚点" size="small">
          {rollbackPoints.length === 0 ? (
            <Typography.Text type="secondary">导入备份后会自动保留最近三个回滚点。</Typography.Text>
          ) : (
            <List
              size="small"
              dataSource={rollbackPoints}
              renderItem={(point) => (
                <List.Item
                  actions={[
                    <Button
                      key="restore"
                      type="link"
                      size="small"
                      icon={<RotateCcw size={14} />}
                      onClick={() => void restoreRollback(point.id)}
                    >
                      恢复
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={new Date(point.createdAt).toLocaleString('zh-CN')}
                    description="导入操作前的自动快照"
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card title="数据清理" size="small">
          <Space wrap>
            <Select
              data-testid="clear-module-select"
              value={clearModuleName}
              options={MODULE_OPTIONS}
              onChange={setClearModuleName}
              style={{ width: 160 }}
            />
            <Button
              data-testid="clear-module-button"
              danger
              icon={<Trash2 size={16} />}
              onClick={() => void doClearModule(clearModuleName)}
            >
              清空所选模块
            </Button>
            <Button
              data-testid="clear-all-button"
              danger
              type="primary"
              icon={<Trash2 size={16} />}
              onClick={doClearAll}
            >
              清空全部数据
            </Button>
          </Space>
        </Card>

        <Card title="基础偏好" size="small">
          <Space direction="vertical" size={12}>
            <Space wrap>
              <Typography.Text>默认打开页</Typography.Text>
              <Select
                data-testid="default-route-select"
                value={settings?.defaultRoute ?? '/home'}
                options={ROUTE_OPTIONS}
                onChange={(value) => void changeDefaultRoute(value)}
                style={{ width: 180 }}
              />
            </Space>
            <Space wrap>
              <Typography.Text>饮水目标（毫升）</Typography.Text>
              <Input
                data-testid="water-goal-input"
                type="number"
                value={settings?.waterGoalMl ?? 2000}
                min={500}
                max={10000}
                style={{ width: 140 }}
                onBlur={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value)) void settingsRepo.update({ waterGoalMl: value })
                }}
              />
            </Space>
          </Space>
        </Card>
      </div>

      <Modal
        open={importPreviewOpen}
        title="确认恢复备份"
        okText="确认恢复"
        cancelText="取消"
        onOk={doRestore}
        onCancel={() => {
          setPendingBackup(null)
          setImportPreviewOpen(false)
        }}
      >
        <Descriptions
          column={1}
          size="small"
          items={[
            {
              key: 'exported-at',
              label: '备份时间',
              children: pendingBackup ? new Date(pendingBackup.exportedAt).toLocaleString('zh-CN') : '-',
            },
            {
              key: 'tables',
              label: '包含表',
              children: pendingBackup ? Object.keys(pendingBackup.tables).length : 0,
            },
          ]}
        />
        <Typography.Paragraph type="warning" style={{ marginTop: 14, marginBottom: 0 }}>
          当前数据会先保存为回滚点，然后被备份文件整体替换。
        </Typography.Paragraph>
      </Modal>
    </>
  )
}
