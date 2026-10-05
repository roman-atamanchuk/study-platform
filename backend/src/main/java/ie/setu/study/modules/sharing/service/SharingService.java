package ie.setu.study.modules.sharing.service;

import ie.setu.study.common.exception.ApiException;
import ie.setu.study.common.util.TokenHashUtil;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.sharing.dto.AcceptShareResponse;
import ie.setu.study.modules.sharing.dto.CreateShareLinkRequest;
import ie.setu.study.modules.sharing.dto.ShareLinkResponse;
import ie.setu.study.modules.sharing.dto.SharePreviewResponse;
import ie.setu.study.modules.sharing.dto.SharedCourseResponse;
import ie.setu.study.modules.sharing.model.ShareInviteLink;
import ie.setu.study.modules.sharing.model.SharedCourseAccess;
import ie.setu.study.modules.sharing.repository.ShareInviteLinkRepository;
import ie.setu.study.modules.sharing.repository.SharedCourseAccessRepository;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import ie.setu.study.modules.workspace.service.UserCourseAccessService;
import ie.setu.study.modules.workspace.service.UserCourseService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SharingService {

    private final ShareInviteLinkRepository shareInviteLinkRepository;
    private final SharedCourseAccessRepository sharedCourseAccessRepository;
    private final UserCourseRepository userCourseRepository;
    private final MaterialRepository materialRepository;
    private final UserCourseAccessService userCourseAccessService;
    private final CurrentUserProvider currentUserProvider;
    private final String frontendBaseUrl;

    public SharingService(
        ShareInviteLinkRepository shareInviteLinkRepository,
        SharedCourseAccessRepository sharedCourseAccessRepository,
        UserCourseRepository userCourseRepository,
        MaterialRepository materialRepository,
        UserCourseAccessService userCourseAccessService,
        CurrentUserProvider currentUserProvider,
        @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl
    ) {
        this.shareInviteLinkRepository = shareInviteLinkRepository;
        this.sharedCourseAccessRepository = sharedCourseAccessRepository;
        this.userCourseRepository = userCourseRepository;
        this.materialRepository = materialRepository;
        this.userCourseAccessService = userCourseAccessService;
        this.currentUserProvider = currentUserProvider;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
    }

    @Transactional(readOnly = true)
    public SharePreviewResponse previewShare(String token) {
        ShareInviteLink link = shareInviteLinkRepository.findByToken(token)
            .orElseThrow(() -> new ApiException("SHARE_LINK_NOT_FOUND", "Share link not found"));
        UserCourse userCourse = link.getUserCourse();
        Course course = userCourse.getCourse();
        StudyUser owner = userCourse.getUser();
        int materialCount = materialRepository.findAccessibleForUserCourse(
            course.getId(),
            userCourse.getId(),
            null
        ).size();
        return new SharePreviewResponse(
            UserCourseService.resolveWorkspaceTitle(userCourse),
            course.getCode(),
            course.getDescription(),
            course.getIconUrl(),
            owner.getFirstName() + " " + owner.getLastName(),
            materialCount,
            link.isActive()
        );
    }

    public AcceptShareResponse acceptShare(String token) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        ShareInviteLink link = shareInviteLinkRepository.findByToken(token)
            .orElseThrow(() -> new ApiException("SHARE_LINK_NOT_FOUND", "Share link not found"));
        if (!link.isActive()) {
            throw new ApiException("SHARE_LINK_INACTIVE", "Share link is no longer active");
        }

        UserCourse source = link.getUserCourse();
        if (source.getUser().getId().equals(user.getId())) {
            throw new ApiException("SHARE_SELF", "You cannot accept your own share link");
        }

        SharedCourseAccess access = sharedCourseAccessRepository
            .findByUserCourse_IdAndSharedWithUser_IdAndRevokedAtIsNull(source.getId(), user.getId())
            .orElseGet(() -> {
                SharedCourseAccess created = new SharedCourseAccess();
                created.setUserCourse(source);
                created.setSharedWithUser(user);
                created.setShareInviteLink(link);
                return sharedCourseAccessRepository.save(created);
            });

        UserCourse copy = userCourseRepository
            .findByUser_IdAndCourse_IdAndArchivedFalse(user.getId(), source.getCourse().getId())
            .orElseGet(() -> {
                UserCourse created = new UserCourse();
                created.setUser(user);
                created.setCourse(source.getCourse());
                created.setSourceUserCourse(source);
                created.setArchived(false);
                return userCourseRepository.save(created);
            });

        return new AcceptShareResponse(copy.getId(), access.getId());
    }

    public ShareLinkResponse createShareLink(Long userCourseId, CreateShareLinkRequest request) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        ShareInviteLink link = new ShareInviteLink();
        link.setUserCourse(userCourse);
        link.setToken(TokenHashUtil.generateRawToken());
        link.setLabel(request.label());
        return toShareLinkResponse(shareInviteLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public List<ShareLinkResponse> listShareLinks(Long userCourseId) {
        userCourseAccessService.requireOwnedUserCourse(userCourseId);
        return shareInviteLinkRepository.findByUserCourse_IdOrderByCreatedAtDesc(userCourseId)
            .stream()
            .map(this::toShareLinkResponse)
            .toList();
    }

    public ShareLinkResponse revokeShareLink(Long shareLinkId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        ShareInviteLink link = shareInviteLinkRepository.findById(shareLinkId)
            .orElseThrow(() -> new ApiException("SHARE_LINK_NOT_FOUND", "Share link not found"));
        if (!link.getUserCourse().getUser().getId().equals(user.getId())) {
            throw new ApiException("ACCESS_DENIED", "You do not own this share link");
        }
        link.setRevokedAt(OffsetDateTime.now());
        return toShareLinkResponse(shareInviteLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public List<SharedCourseResponse> listSharedCourses() {
        StudyUser user = currentUserProvider.requireCurrentUser();
        return sharedCourseAccessRepository
            .findBySharedWithUser_IdAndRevokedAtIsNullOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(this::toSharedCourseResponse)
            .toList();
    }

    public void revokeSharedAccess(Long sharedAccessId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        SharedCourseAccess access = sharedCourseAccessRepository.findById(sharedAccessId)
            .orElseThrow(() -> new ApiException("SHARED_ACCESS_NOT_FOUND", "Shared access not found"));
        if (!access.getUserCourse().getUser().getId().equals(user.getId())) {
            throw new ApiException("ACCESS_DENIED", "Only the course owner can revoke shared access");
        }
        access.setRevokedAt(OffsetDateTime.now());
        sharedCourseAccessRepository.save(access);
    }

    private ShareLinkResponse toShareLinkResponse(ShareInviteLink link) {
        return new ShareLinkResponse(
            link.getId(),
            link.getToken(),
            link.getLabel(),
            link.getCreatedAt(),
            link.getExpiresAt(),
            link.isActive(),
            frontendBaseUrl + "/share/" + link.getToken()
        );
    }

    private SharedCourseResponse toSharedCourseResponse(SharedCourseAccess access) {
        UserCourse ownerCourse = access.getUserCourse();
        Course course = ownerCourse.getCourse();
        StudyUser owner = ownerCourse.getUser();
        StudyUser viewer = access.getSharedWithUser();
        Long workspaceId = userCourseRepository
            .findByUser_IdAndSourceUserCourse_IdAndArchivedFalse(viewer.getId(), ownerCourse.getId())
            .map(UserCourse::getId)
            .orElse(ownerCourse.getId());
        return new SharedCourseResponse(
            access.getId(),
            workspaceId,
            course.getId(),
            UserCourseService.resolveWorkspaceTitle(ownerCourse),
            course.getCode(),
            owner.getFirstName() + " " + owner.getLastName(),
            access.getCreatedAt()
        );
    }
}
