import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  description?: string
  comingSoon?: string
}

export function PlaceholderPage({ title, description, comingSoon }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState title="页面骨架已就绪" description={comingSoon ?? '该模块将在后续阶段实现'} />
    </>
  )
}
