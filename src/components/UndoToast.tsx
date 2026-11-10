import { Button } from 'antd'
import { Undo2 } from 'lucide-react'
import { useUndoStore } from '@/stores/undoStore'

export function UndoToast() {
  const title = useUndoStore((state) => state.title)
  const action = useUndoStore((state) => state.action)
  const clearUndo = useUndoStore((state) => state.clearUndo)

  if (!title || !action) return null

  return (
    <div className="undo-toast" data-testid="undo-toast">
      <span>已删除：{title}</span>
      <Button
        type="text"
        size="small"
        icon={<Undo2 size={15} />}
        onClick={() => {
          void action()
          clearUndo()
        }}
      >
        撤销
      </Button>
      <Button type="text" size="small" aria-label="关闭撤销提示" onClick={clearUndo}>
        关闭
      </Button>
    </div>
  )
}
