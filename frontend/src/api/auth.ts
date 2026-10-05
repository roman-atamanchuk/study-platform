import { apiFetch } from './client'
import type { LoginRequest, RegisterRequest, UserResponse } from '../types/api'

export interface ForgotPasswordResponse {
  message: string
  resetToken?: string | null
  resetUrl?: string | null
}

export function register(request: RegisterRequest): Promise<UserResponse> {
  return apiFetch<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function login(request: LoginRequest): Promise<UserResponse> {
  return apiFetch<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
  })
}

export function fetchCurrentUser(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/auth/me')
}

export function fetchProfile(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/me')
}

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(token: string, password: string): Promise<void> {
  return apiFetch<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
