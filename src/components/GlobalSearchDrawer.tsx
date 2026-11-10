import { Drawer, Input, List, Tag, Typography } from 'antd'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { searchAll } from '@/data/search'
import { useUiStore } from '@/stores/uiStore'
import type { SearchResult } from '@/domain/types'

const RESULT_LABELS: Record<SearchResult['type'], string> = {
  memo: '备忘',
  plan: '计划',
  media: '自媒体',
  dev: '开发',
  project: '项目',
  consult: '咨询',
  client: '客户',
  fitness: '健身',
  diet: '饮食',
  game: '娱乐',
  manual: '计划',
}

export function GlobalSearchDrawer() {
  const open = useUiStore((state) => state.searchOpen)
  const setOpen = useUiStore((state) => state.setSearchOpen)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const results = useLiveQuery<SearchResult[], SearchResult[]>(
    () => searchAll(query),
    [query],
    [],
  )

  const openResult = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    navigate(result.route)
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        setOpen(false)
        setQuery('')
      }}
      title="全局搜索"
      width={520}
    >
      <Input
        data-testid="global-search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        prefix={<Search size={16} />}
        placeholder="搜索备忘、计划、客户、内容、项目和游戏"
        allowClear
        autoFocus
      />
      <div style={{ marginTop: 18 }}>
        {!query ? (
          <Typography.Text type="secondary">输入关键词开始搜索。</Typography.Text>
        ) : results.length === 0 ? (
          <Typography.Text type="secondary">没有找到相关内容。</Typography.Text>
        ) : (
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                data-testid={`search-result-${item.id}`}
                onClick={() => openResult(item)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  title={<span>{item.title}</span>}
                  description={item.subtitle}
                />
                <Tag>{RESULT_LABELS[item.type]}</Tag>
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  )
}
