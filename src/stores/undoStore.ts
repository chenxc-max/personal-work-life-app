import { create } from 'zustand'

interface UndoState {
  title?: string
  action?: () => Promise<void> | void
  showUndo: (title: string, action: () => Promise<void> | void) => void
  clearUndo: () => void
}

export const useUndoStore = create<UndoState>((set) => ({
  showUndo: (title, action) => set({ title, action }),
  clearUndo: () => set({ title: undefined, action: undefined }),
}))
