import type { ActivePanel } from '../../../api/workspace'
import type { PdfFitMode } from '../components/PdfViewer'
import { DEFAULT_DIVIDER } from '../components/StudyWorkspace'

/** View + content state for one side of the dual workspace. */
export interface PanelViewState {
  materialId: number | null
  page: number
  zoom: number
  fitMode: PdfFitMode
  scrollPosition: number | null
}

export interface DualPanelViewState {
  left: PanelViewState
  right: PanelViewState
  activePanel: ActivePanel
  dividerPosition: number
}

function clampDivider(value: number): number {
  return Math.min(75, Math.max(25, value))
}

/** Mirror left ↔ right: content and viewing settings move together, including panel width. */
export function mirrorSwapDualPanels(state: DualPanelViewState): DualPanelViewState {
  return {
    left: { ...state.right },
    right: { ...state.left },
    activePanel: state.activePanel === 'LEFT' ? 'RIGHT' : 'LEFT',
    dividerPosition: clampDivider(100 - state.dividerPosition),
  }
}

export function dualPanelStateFromWorkspace(
  workspace: {
    leftMaterialId: number | null
    rightMaterialId: number | null
    leftPage: number | null
    rightPage: number | null
    leftZoom: number | null
    rightZoom: number | null
    leftScrollPosition: number | null
    rightScrollPosition: number | null
    dividerPosition: number | null
    activePanel: ActivePanel | null
  },
  leftFitMode: PdfFitMode,
  rightFitMode: PdfFitMode,
): DualPanelViewState {
  return {
    left: {
      materialId: workspace.leftMaterialId,
      page: workspace.leftPage ?? 1,
      zoom: workspace.leftZoom ?? 1,
      fitMode: leftFitMode,
      scrollPosition: workspace.leftScrollPosition,
    },
    right: {
      materialId: workspace.rightMaterialId,
      page: workspace.rightPage ?? 1,
      zoom: workspace.rightZoom ?? 1,
      fitMode: rightFitMode,
      scrollPosition: workspace.rightScrollPosition,
    },
    activePanel: workspace.activePanel ?? 'LEFT',
    dividerPosition: workspace.dividerPosition ?? DEFAULT_DIVIDER,
  }
}
