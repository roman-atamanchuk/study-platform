package ie.setu.study.modules.workspace.service;

import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.dto.AddUserCourseRequest;
import ie.setu.study.modules.workspace.dto.UpdateUserCourseRequest;
import ie.setu.study.modules.workspace.dto.UserCourseResponse;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserCourseService {

    private final UserCourseRepository userCourseRepository;
    private final CourseRepository courseRepository;
    private final CurrentUserProvider currentUserProvider;
    private final UserCourseAccessService userCourseAccessService;

    public UserCourseService(
        UserCourseRepository userCourseRepository,
        CourseRepository courseRepository,
        CurrentUserProvider currentUserProvider,
        UserCourseAccessService userCourseAccessService
    ) {
        this.userCourseRepository = userCourseRepository;
        this.courseRepository = courseRepository;
        this.currentUserProvider = currentUserProvider;
        this.userCourseAccessService = userCourseAccessService;
    }

    @Transactional(readOnly = true)
    public List<UserCourseResponse> listActive() {
        StudyUser user = currentUserProvider.requireCurrentUser();
        return userCourseRepository.findByUser_IdAndArchivedFalseOrderByAddedAtDesc(user.getId())
            .stream()
            .map(uc -> toResponse(uc, user))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UserCourseResponse> listArchived() {
        StudyUser user = currentUserProvider.requireCurrentUser();
        return userCourseRepository.findByUser_IdAndArchivedTrueOrderByAddedAtDesc(user.getId())
            .stream()
            .map(uc -> toResponse(uc, user))
            .toList();
    }

    public UserCourseResponse addCourse(AddUserCourseRequest request) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        Course course = courseRepository.findById(request.courseId())
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ApiException("COURSE_HIDDEN", "Course is not available");
        }

        boolean createAnother = Boolean.TRUE.equals(request.createAnother());
        if (userCourseRepository.existsByUser_IdAndCourse_IdAndArchivedFalse(user.getId(), course.getId())
            && !createAnother) {
            throw new ApiException("USER_COURSE_EXISTS", "Course is already in your library");
        }

        UserCourse userCourse = new UserCourse();
        userCourse.setUser(user);
        userCourse.setCourse(course);
        userCourse.setArchived(false);
        userCourse.setDisplayName(normalizeDisplayName(request.displayName(), course.getName()));
        return toResponse(userCourseRepository.save(userCourse), user);
    }

    public UserCourseResponse updateDisplayName(Long userCourseId, UpdateUserCourseRequest request) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        userCourse.setDisplayName(normalizeDisplayName(request.displayName(), userCourse.getCourse().getName()));
        return toResponse(userCourse, currentUserProvider.requireCurrentUser());
    }

    public UserCourseResponse archive(Long userCourseId) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        userCourse.setArchived(true);
        return toResponse(userCourse, currentUserProvider.requireCurrentUser());
    }

    public UserCourseResponse unarchive(Long userCourseId) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        userCourse.setArchived(false);
        return toResponse(userCourse, currentUserProvider.requireCurrentUser());
    }

    @Transactional(readOnly = true)
    public UserCourseResponse getUserCourse(Long userCourseId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        UserCourse userCourse = userCourseAccessService.requireAccessibleUserCourse(userCourseId);
        return toResponse(userCourse, user);
    }

    static String normalizeDisplayName(String displayName, String officialName) {
        if (displayName == null) {
            return null;
        }
        String trimmed = displayName.trim();
        if (trimmed.isEmpty() || trimmed.equals(officialName)) {
            return null;
        }
        return trimmed;
    }

    public static String resolveWorkspaceTitle(UserCourse userCourse) {
        String custom = userCourse.getDisplayName();
        if (custom != null && !custom.isBlank()) {
            return custom.trim();
        }
        return userCourse.getCourse().getName();
    }

    private UserCourseResponse toResponse(UserCourse userCourse, StudyUser currentUser) {
        Course course = userCourse.getCourse();
        return new UserCourseResponse(
            userCourse.getId(),
            course.getId(),
            userCourse.getDisplayName(),
            course.getName(),
            course.getCode(),
            course.getProgramme().getName(),
            course.getSemesterNumber(),
            userCourse.isArchived(),
            userCourse.getAddedAt(),
            userCourseAccessService.isOwner(userCourse, currentUser)
        );
    }
}
