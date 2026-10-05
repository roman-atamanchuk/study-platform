package ie.setu.study.modules.course.service;

import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.course.dto.CourseDetailResponse;
import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import ie.setu.study.modules.course.mapper.CourseMapper;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.storage.repository.StoredFileRepository;
import ie.setu.study.modules.storage.service.FileStorageService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final StoredFileRepository storedFileRepository;
    private final FileStorageService fileStorageService;

    public CourseService(
        CourseRepository courseRepository,
        CourseMapper courseMapper,
        StoredFileRepository storedFileRepository,
        FileStorageService fileStorageService
    ) {
        this.courseRepository = courseRepository;
        this.courseMapper = courseMapper;
        this.storedFileRepository = storedFileRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ApiException("COURSE_HIDDEN", "Course is not publicly available");
        }

        return courseMapper.toDetail(course);
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> searchCourses(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return courseMapper.toSummaryList(courseRepository.searchPublished(query.trim(), CourseStatus.PUBLISHED));
    }

    @Transactional(readOnly = true)
    public IconPayload getCourseIcon(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ApiException("COURSE_HIDDEN", "Course is not publicly available");
        }
        String iconUrl = course.getIconUrl();
        if (iconUrl == null || !iconUrl.startsWith("stored:")) {
            throw new ApiException("ICON_NOT_FOUND", "Course has no icon");
        }
        Long storedFileId = Long.parseLong(iconUrl.substring("stored:".length()));
        var storedFile = storedFileRepository.findById(storedFileId)
            .orElseThrow(() -> new ApiException("ICON_NOT_FOUND", "Course icon not found"));
        try {
            Resource resource = new UrlResource(fileStorageService.resolvePath(storedFile).toUri());
            if (!resource.exists()) {
                throw new ApiException("ICON_NOT_FOUND", "Course icon file missing");
            }
            return new IconPayload(resource, storedFile.getMimeType());
        } catch (Exception exception) {
            throw new ApiException("ICON_NOT_FOUND", "Unable to load course icon");
        }
    }

    public record IconPayload(Resource resource, String contentType) {}
}
