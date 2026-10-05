package ie.setu.study.modules.programme.mapper;

import ie.setu.study.modules.course.mapper.CourseMapper;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.programme.dto.ProgrammeDetailResponse;
import ie.setu.study.modules.programme.dto.ProgrammeSummaryResponse;
import ie.setu.study.modules.programme.model.Programme;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ProgrammeMapper {

    private final CourseMapper courseMapper;

    public ProgrammeMapper(CourseMapper courseMapper) {
        this.courseMapper = courseMapper;
    }

    public ProgrammeSummaryResponse toSummary(Programme programme) {
        return new ProgrammeSummaryResponse(
            programme.getId(),
            programme.getCode(),
            programme.getName(),
            programme.getStreamName(),
            programme.getDescription()
        );
    }

    public ProgrammeDetailResponse toDetail(Programme programme, List<Course> courses) {
        return new ProgrammeDetailResponse(
            programme.getId(),
            programme.getCode(),
            programme.getName(),
            programme.getStreamName(),
            programme.getDescription(),
            courseMapper.toSummaryList(courses)
        );
    }
}
