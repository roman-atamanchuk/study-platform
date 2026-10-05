import { apiFetch } from './client'

export type WorkspaceViewMode = 'SINGLE' | 'DUAL'
export type ActivePanel = 'LEFT' | 'RIGHT'

export interface WorkspaceState {
  id: number | null
  userCourseId: number
  leftMaterialId: number | null
  rightMaterialId: number | null
  leftPage: number | null
  rightPage: number | null
  leftScrollPosition: number | null
  rightScrollPosition: number | null
  leftZoom: number | null
  rightZoom: number | null
  dividerPosition: number | null
  activePanel: ActivePanel | null
  viewMode: WorkspaceViewMode
}

export function fetchWorkspaceState(userCourseId: number): Promise<WorkspaceState> {
  return apiFetch(`/workspace-state/${userCourseId}`)
}

export function saveWorkspaceState(
  userCourseId: number,
  state: Partial<WorkspaceState>,
): Promise<WorkspaceState> {
  return apiFetch(`/workspace-state/${userCourseId}`, {
    method: 'POST',
    body: JSON.stringify(state),
  })
}
