import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="empty-state"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 220,
        padding: 28,
        color: '#7b8491',
        textAlign: 'center',
      }}
    >
      <div>
        <Inbox size={30} strokeWidth={1.6} style={{ margin: '0 auto 10px' }} />
        <div style={{ marginBottom: 4, color: '#4b5563', fontWeight: 600 }}>{title}</div>
        {description ? <div style={{ marginBottom: 14, fontSize: 13 }}>{description}</div> : null}
        {action}
      </div>
    </div>
  )
}
