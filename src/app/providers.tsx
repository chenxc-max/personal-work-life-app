import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { PropsWithChildren } from 'react'

dayjs.locale('zh-cn')

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorText: '#1f2937',
          colorBorder: '#dbe2ea',
          borderRadius: 8,
          fontFamily:
            "Inter, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif",
        },
        components: {
          Layout: { bodyBg: '#f4f6f8' },
          Card: { borderRadiusLG: 8 },
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}
