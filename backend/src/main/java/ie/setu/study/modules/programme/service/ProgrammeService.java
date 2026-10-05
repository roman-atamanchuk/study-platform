package ie.setu.study.modules.programme.service;

import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.course.mapper.CourseMapper;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.programme.dto.ProgrammeDetailResponse;
import ie.setu.study.modules.programme.dto.ProgrammeSummaryResponse;
import ie.setu.study.modules.programme.dto.PublicLibraryResponse;
import ie.setu.study.modules.programme.mapper.ProgrammeMapper;
import ie.setu.study.modules.programme.model.Programme;
import ie.setu.study.modules.programme.repository.ProgrammeRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgrammeService {

    private final ProgrammeRepository programmeRepository;
    private final CourseRepository courseRepository;
    private final ProgrammeMapper programmeMapper;
    private final CourseMapper courseMapper;

    public ProgrammeService(
        ProgrammeRepository programmeRepository,
        CourseRepository courseRepository,
        ProgrammeMapper programmeMapper,
        CourseMapper courseMapper
    ) {
        this.programmeRepository = programmeRepository;
        this.courseRepository = courseRepository;
        this.programmeMapper = programmeMapper;
        this.courseMapper = courseMapper;
    }

    @Transactional(readOnly = true)
    public PublicLibraryResponse getPublicLibrary() {
        List<Programme> programmes = programmeRepository.findAll();
        List<ProgrammeSummaryResponse> programmeSummaries = programmes.stream()
            .map(programmeMapper::toSummary)
            .toList();

        List<Course> featuredCourses = programmes.stream()
            .flatMap(programme -> courseRepository
                .findByProgrammeIdAndStatusOrderBySemesterNumberAscNameAsc(programme.getId(), CourseStatus.PUBLISHED)
                .stream())
            .limit(6)
            .toList();

        return new PublicLibraryResponse(programmeSummaries, courseMapper.toSummaryList(featuredCourses));
    }

    @Transactional(readOnly = true)
    public List<ProgrammeSummaryResponse> listProgrammes() {
        return programmeRepository.findAll().stream()
            .map(programmeMapper::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public ProgrammeDetailResponse getProgramme(Long programmeId) {
        Programme programme = programmeRepository.findById(programmeId)
            .orElseThrow(() -> new ApiException("PROGRAMME_NOT_FOUND", "Programme not found"));

        List<Course> courses = courseRepository.findByProgrammeIdAndStatusOrderBySemesterNumberAscNameAsc(
            programmeId,
            CourseStatus.PUBLISHED
        );

        return programmeMapper.toDetail(programme, courses);
    }
}
