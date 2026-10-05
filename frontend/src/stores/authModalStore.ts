import { create } from 'zustand'

interface AuthModalState {
  open: boolean
  redirectPath: string | null
  openLogin: (redirectPath?: string) => void
  closeLogin: () => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  redirectPath: null,
  openLogin: (redirectPath) => set({ open: true, redirectPath: redirectPath ?? null }),
  closeLogin: () => set({ open: false, redirectPath: null }),
}))
