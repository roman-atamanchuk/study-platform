export interface ApiErrorResponse {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export class ApiError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(response: ApiErrorResponse) {
    super(response.message)
    this.name = 'ApiError'
    this.code = response.code
    this.fieldErrors = response.fieldErrors
  }
}

export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  studentNumber: string
  role: 'USER' | 'ADMIN'
  programmeId: number | null
  currentSemesterNumber: number | null
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  studentNumber: string
  password: string
  programmeId?: number
  currentSemesterNumber?: number
}

export interface LoginRequest {
  email: string
  password: string
}
