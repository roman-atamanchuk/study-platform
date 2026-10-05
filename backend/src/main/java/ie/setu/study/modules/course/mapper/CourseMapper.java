package ie.setu.study.modules.course.mapper;

import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.course.dto.CourseDetailResponse;
import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.material.repository.MaterialRepository;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    private final MaterialRepository materialRepository;

    public CourseMapper(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    public CourseSummaryResponse toSummary(Course course) {
        long publicMaterialCount = materialRepository.countByCourse_IdAndOfficialTrueAndVisibility(
            course.getId(),
            MaterialVisibility.PUBLIC
        );
        return new CourseSummaryResponse(
            course.getId(),
            course.getProgramme().getId(),
            course.getSemesterNumber(),
            course.getName(),
            course.getCode(),
            course.getIconUrl(),
            course.getStatus(),
            publicMaterialCount
        );
    }

    public List<CourseSummaryResponse> toSummaryList(List<Course> courses) {
        return courses.stream().map(this::toSummary).toList();
    }

    public CourseDetailResponse toDetail(Course course) {
        long publicMaterialCount = materialRepository.countByCourse_IdAndOfficialTrueAndVisibility(
            course.getId(),
            MaterialVisibility.PUBLIC
        );
        long totalMaterialCount = materialRepository.countByCourse_IdAndOfficialTrue(course.getId());
        return new CourseDetailResponse(
            course.getId(),
            course.getProgramme().getId(),
            course.getProgramme().getName(),
            course.getProgramme().getCode(),
            course.getSemesterNumber(),
            course.getName(),
            course.getCode(),
            course.getIconUrl(),
            course.getDescription(),
            course.getStatus(),
            publicMaterialCount,
            totalMaterialCount
        );
    }
}
