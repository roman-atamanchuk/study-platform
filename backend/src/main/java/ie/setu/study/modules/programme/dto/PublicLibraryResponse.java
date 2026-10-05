package ie.setu.study.modules.programme.dto;

import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import java.util.List;

public record PublicLibraryResponse(
    List<ProgrammeSummaryResponse> programmes,
    List<CourseSummaryResponse> featuredCourses
) {
}
