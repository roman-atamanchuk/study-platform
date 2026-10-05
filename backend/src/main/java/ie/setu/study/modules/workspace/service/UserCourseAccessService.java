package ie.setu.study.modules.workspace.service;

import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.sharing.repository.SharedCourseAccessRepository;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserCourseAccessService {

    private final UserCourseRepository userCourseRepository;
    private final SharedCourseAccessRepository sharedCourseAccessRepository;
    private final CurrentUserProvider currentUserProvider;

    public UserCourseAccessService(
        UserCourseRepository userCourseRepository,
        SharedCourseAccessRepository sharedCourseAccessRepository,
        CurrentUserProvider currentUserProvider
    ) {
        this.userCourseRepository = userCourseRepository;
        this.sharedCourseAccessRepository = sharedCourseAccessRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public UserCourse requireAccessibleUserCourse(Long userCourseId) {
        StudyUser currentUser = currentUserProvider.requireCurrentUser();
        UserCourse userCourse = userCourseRepository.findById(userCourseId)
            .orElseThrow(() -> new ApiException("USER_COURSE_NOT_FOUND", "User course not found"));
        if (isOwner(userCourse, currentUser)) {
            return userCourse;
        }
        boolean shared = sharedCourseAccessRepository
            .existsByUserCourse_IdAndSharedWithUser_IdAndRevokedAtIsNull(userCourseId, currentUser.getId());
        if (!shared) {
            throw new ApiException("ACCESS_DENIED", "You do not have access to this course");
        }
        return userCourse;
    }

    public UserCourse requireOwnedUserCourse(Long userCourseId) {
        StudyUser currentUser = currentUserProvider.requireCurrentUser();
        UserCourse userCourse = userCourseRepository.findById(userCourseId)
            .orElseThrow(() -> new ApiException("USER_COURSE_NOT_FOUND", "User course not found"));
        if (!isOwner(userCourse, currentUser)) {
            throw new ApiException("ACCESS_DENIED", "You do not own this course");
        }
        return userCourse;
    }

    public boolean isOwner(UserCourse userCourse, StudyUser user) {
        return userCourse.getUser().getId().equals(user.getId());
    }
}
