package ie.setu.study.modules.workspace.dto;

import ie.setu.study.common.enums.ActivePanel;
import ie.setu.study.common.enums.WorkspaceViewMode;

public record SaveWorkspaceStateRequest(
    Long leftMaterialId,
    Long rightMaterialId,
    Integer leftPage,
    Integer rightPage,
    Double leftScrollPosition,
    Double rightScrollPosition,
    Double leftZoom,
    Double rightZoom,
    Double dividerPosition,
    ActivePanel activePanel,
    WorkspaceViewMode viewMode
) {}
