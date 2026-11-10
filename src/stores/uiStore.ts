import { create } from 'zustand'

interface UiState {
  quickCaptureOpen: boolean
  searchOpen: boolean
  setQuickCaptureOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  quickCaptureOpen: false,
  searchOpen: false,
  setQuickCaptureOpen: (quickCaptureOpen) => set({ quickCaptureOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}))
