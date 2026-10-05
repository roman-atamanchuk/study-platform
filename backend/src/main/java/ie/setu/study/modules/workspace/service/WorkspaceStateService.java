package ie.setu.study.modules.workspace.service;

import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.dto.SaveWorkspaceStateRequest;
import ie.setu.study.modules.workspace.dto.WorkspaceStateResponse;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.model.WorkspaceState;
import ie.setu.study.modules.workspace.repository.WorkspaceStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WorkspaceStateService {

    private final WorkspaceStateRepository workspaceStateRepository;
    private final MaterialRepository materialRepository;
    private final UserCourseAccessService userCourseAccessService;
    private final CurrentUserProvider currentUserProvider;

    public WorkspaceStateService(
        WorkspaceStateRepository workspaceStateRepository,
        MaterialRepository materialRepository,
        UserCourseAccessService userCourseAccessService,
        CurrentUserProvider currentUserProvider
    ) {
        this.workspaceStateRepository = workspaceStateRepository;
        this.materialRepository = materialRepository;
        this.userCourseAccessService = userCourseAccessService;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public WorkspaceStateResponse load(Long userCourseId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        UserCourse userCourse = userCourseAccessService.requireAccessibleUserCourse(userCourseId);
        return workspaceStateRepository.findByUser_IdAndUserCourse_Id(user.getId(), userCourseId)
            .map(this::toResponse)
            .orElseGet(() -> emptyResponse(userCourseId));
    }

    public WorkspaceStateResponse save(Long userCourseId, SaveWorkspaceStateRequest request) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        UserCourse userCourse = userCourseAccessService.requireAccessibleUserCourse(userCourseId);
        if (!userCourseAccessService.isOwner(userCourse, user)) {
            throw new ApiException("ACCESS_DENIED", "Shared viewers cannot persist workspace state");
        }

        WorkspaceState state = workspaceStateRepository
            .findByUser_IdAndUserCourse_Id(user.getId(), userCourseId)
            .orElseGet(WorkspaceState::new);

        state.setUser(user);
        state.setCourse(userCourse.getCourse());
        state.setUserCourse(userCourse);
        state.setLeftMaterial(resolveMaterial(request.leftMaterialId(), userCourse));
        state.setRightMaterial(resolveMaterial(request.rightMaterialId(), userCourse));
        state.setLeftPage(request.leftPage());
        state.setRightPage(request.rightPage());
        state.setLeftScrollPosition(request.leftScrollPosition());
        state.setRightScrollPosition(request.rightScrollPosition());
        state.setLeftZoom(request.leftZoom());
        state.setRightZoom(request.rightZoom());
        state.setDividerPosition(request.dividerPosition());
        state.setActivePanel(request.activePanel());
        if (request.viewMode() != null) {
            state.setViewMode(request.viewMode());
        }

        return toResponse(workspaceStateRepository.save(state));
    }

    private Material resolveMaterial(Long materialId, UserCourse userCourse) {
        if (materialId == null) {
            return null;
        }
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (!material.getCourse().getId().equals(userCourse.getCourse().getId())) {
            throw new ApiException("ACCESS_DENIED", "Material does not belong to this course");
        }
        return material;
    }

    private WorkspaceStateResponse emptyResponse(Long userCourseId) {
        return new WorkspaceStateResponse(
            null,
            userCourseId,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            ie.setu.study.common.enums.WorkspaceViewMode.DUAL
        );
    }

    private WorkspaceStateResponse toResponse(WorkspaceState state) {
        return new WorkspaceStateResponse(
            state.getId(),
            state.getUserCourse().getId(),
            state.getLeftMaterial() == null ? null : state.getLeftMaterial().getId(),
            state.getRightMaterial() == null ? null : state.getRightMaterial().getId(),
            state.getLeftPage(),
            state.getRightPage(),
            state.getLeftScrollPosition(),
            state.getRightScrollPosition(),
            state.getLeftZoom(),
            state.getRightZoom(),
            state.getDividerPosition(),
            state.getActivePanel(),
            state.getViewMode()
        );
    }
}
