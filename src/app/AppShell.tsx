import {
  ClipboardList,
  Code2,
  Dumbbell,
  Gamepad2,
  Home,
  LayoutGrid,
  MessagesSquare,
  Radio,
  Salad,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Button, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { NavLink, Outlet } from 'react-router-dom'
import { GlobalSearchDrawer } from '@/components/GlobalSearchDrawer'
import { QuickCaptureModal } from '@/components/QuickCaptureModal'
import { UndoToast } from '@/components/UndoToast'
import { useUiStore } from '@/stores/uiStore'

const navGroups = [
  {
    label: '总览',
    items: [{ label: '首页', route: '/home', icon: Home }],
  },
  {
    label: '计划',
    items: [{ label: '今日计划', route: '/plan', icon: ClipboardList }],
  },
  {
    label: '工作',
    items: [
      { label: '自媒体', route: '/media', icon: Radio },
      { label: '开发工作', route: '/dev', icon: Code2 },
      { label: '咨询工作', route: '/consult', icon: MessagesSquare },
    ],
  },
  {
    label: '生活',
    items: [
      { label: '健身计划', route: '/fitness', icon: Dumbbell },
      { label: '饮食计划', route: '/diet', icon: Salad },
      { label: '游戏娱乐', route: '/games', icon: Gamepad2 },
    ],
  },
  {
    label: '系统',
    items: [{ label: '数据与设置', route: '/settings', icon: Settings }],
  },
]

export function AppShell() {
  const setQuickCaptureOpen = useUiStore((state) => state.setQuickCaptureOpen)
  const setSearchOpen = useUiStore((state) => state.setSearchOpen)

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark">
            <LayoutGrid size={17} />
          </span>
          工作生活
        </div>
        <nav>
          {navGroups.map((group) => (
            <section className="sidebar-group" key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    to={item.route}
                    key={item.route}
                  >
                    <Icon size={17} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </section>
          ))}
        </nav>
      </aside>

      <header className="app-topbar">
        <div className="topbar-date">{dayjs().format('YYYY年M月D日 dddd')}</div>
        <div className="topbar-actions">
          <Tooltip title="全局快速记录">
            <Button
              data-testid="quick-capture-button"
              icon={<Sparkles size={16} />}
              onClick={() => setQuickCaptureOpen(true)}
            >
              快速记录
            </Button>
          </Tooltip>
          <Tooltip title="全局搜索">
            <Button
              data-testid="global-search-button"
              icon={<Search size={16} />}
              onClick={() => setSearchOpen(true)}
            >
              搜索
            </Button>
          </Tooltip>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <QuickCaptureModal />
      <GlobalSearchDrawer />
      <UndoToast />
    </div>
  )
}
