package ie.setu.study.modules.programme.dto;

import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import java.util.List;

public record ProgrammeDetailResponse(
    Long id,
    String code,
    String name,
    String streamName,
    String description,
    List<CourseSummaryResponse> courses
) {
}
