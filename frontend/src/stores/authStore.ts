import { create } from 'zustand'
import { fetchCurrentUser, login, logout, register } from '../api/auth'
import { ApiError, type LoginRequest, type RegisterRequest, type UserResponse } from '../types/api'

interface AuthState {
  user: UserResponse | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
  fieldErrors: Record<string, string> | null
  bootstrap: () => Promise<void>
  signIn: (request: LoginRequest) => Promise<void>
  signUp: (request: RegisterRequest) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function extractError(error: unknown): { message: string; fieldErrors: Record<string, string> | null } {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors ?? null,
    }
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: null }
  }
  return { message: 'Something went wrong', fieldErrors: null }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,
  fieldErrors: null,

  bootstrap: async () => {
    set({ status: 'loading', error: null, fieldErrors: null })
    try {
      const user = await fetchCurrentUser()
      set({ user, status: 'authenticated' })
    } catch {
      set({ user: null, status: 'unauthenticated' })
    }
  },

  signIn: async (request) => {
    set({ status: 'loading', error: null, fieldErrors: null })
    try {
      const user = await login(request)
      set({ user, status: 'authenticated' })
    } catch (error) {
      const parsed = extractError(error)
      set({
        user: null,
        status: 'unauthenticated',
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      })
      throw error
    }
  },

  signUp: async (request) => {
    set({ status: 'loading', error: null, fieldErrors: null })
    try {
      const user = await register(request)
      set({ user, status: 'authenticated' })
    } catch (error) {
      const parsed = extractError(error)
      set({
        user: null,
        status: 'unauthenticated',
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      })
      throw error
    }
  },

  signOut: async () => {
    try {
      await logout()
    } finally {
      set({ user: null, status: 'unauthenticated', error: null, fieldErrors: null })
    }
  },

  clearError: () => set({ error: null, fieldErrors: null }),
}))
