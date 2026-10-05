package ie.setu.study.modules.workspace.controller;

import ie.setu.study.modules.workspace.dto.SaveWorkspaceStateRequest;
import ie.setu.study.modules.workspace.dto.WorkspaceStateResponse;
import ie.setu.study.modules.workspace.service.WorkspaceStateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkspaceStateController {

    private final WorkspaceStateService workspaceStateService;

    public WorkspaceStateController(WorkspaceStateService workspaceStateService) {
        this.workspaceStateService = workspaceStateService;
    }

    @GetMapping("/workspace-state/{userCourseId}")
    public WorkspaceStateResponse load(@PathVariable Long userCourseId) {
        return workspaceStateService.load(userCourseId);
    }

    @PostMapping("/workspace-state/{userCourseId}")
    public WorkspaceStateResponse save(
        @PathVariable Long userCourseId,
        @RequestBody SaveWorkspaceStateRequest request
    ) {
        return workspaceStateService.save(userCourseId, request);
    }
}
