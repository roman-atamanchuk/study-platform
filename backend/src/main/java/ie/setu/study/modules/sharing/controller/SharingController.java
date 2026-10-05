package ie.setu.study.modules.sharing.controller;

import ie.setu.study.modules.sharing.dto.AcceptShareResponse;
import ie.setu.study.modules.sharing.dto.CreateShareLinkRequest;
import ie.setu.study.modules.sharing.dto.ShareLinkResponse;
import ie.setu.study.modules.sharing.dto.SharePreviewResponse;
import ie.setu.study.modules.sharing.dto.SharedCourseResponse;
import ie.setu.study.modules.sharing.service.SharingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SharingController {

    private final SharingService sharingService;

    public SharingController(SharingService sharingService) {
        this.sharingService = sharingService;
    }

    @GetMapping("/share-links/{token}")
    public SharePreviewResponse preview(@PathVariable String token) {
        return sharingService.previewShare(token);
    }

    @PostMapping("/share-links/{token}/accept")
    @ResponseStatus(HttpStatus.CREATED)
    public AcceptShareResponse accept(@PathVariable String token) {
        return sharingService.acceptShare(token);
    }

    @PostMapping("/my-courses/{userCourseId}/share-links")
    @ResponseStatus(HttpStatus.CREATED)
    public ShareLinkResponse createShareLink(
        @PathVariable Long userCourseId,
        @Valid @RequestBody(required = false) CreateShareLinkRequest request
    ) {
        CreateShareLinkRequest body = request == null ? new CreateShareLinkRequest(null) : request;
        return sharingService.createShareLink(userCourseId, body);
    }

    @GetMapping("/my-courses/{userCourseId}/share-links")
    public List<ShareLinkResponse> listShareLinks(@PathVariable Long userCourseId) {
        return sharingService.listShareLinks(userCourseId);
    }

    @PostMapping("/share-links/{shareLinkId}/revoke")
    public ShareLinkResponse revokeShareLink(@PathVariable Long shareLinkId) {
        return sharingService.revokeShareLink(shareLinkId);
    }

    @GetMapping("/shared-courses")
    public List<SharedCourseResponse> listSharedCourses() {
        return sharingService.listSharedCourses();
    }

    @PostMapping("/shared-access/{sharedAccessId}/revoke")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeSharedAccess(@PathVariable Long sharedAccessId) {
        sharingService.revokeSharedAccess(sharedAccessId);
    }
}
