package ie.setu.study.modules.admin.service;

import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.course.dto.CreateCourseRequest;
import ie.setu.study.modules.course.dto.CourseDetailResponse;
import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import ie.setu.study.modules.course.dto.UpdateCourseRequest;
import ie.setu.study.modules.course.mapper.CourseMapper;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.programme.dto.CreateProgrammeRequest;
import ie.setu.study.modules.programme.dto.ProgrammeSummaryResponse;
import ie.setu.study.modules.programme.dto.UpdateProgrammeRequest;
import ie.setu.study.modules.programme.mapper.ProgrammeMapper;
import ie.setu.study.modules.programme.model.Programme;
import ie.setu.study.modules.programme.repository.ProgrammeRepository;
import ie.setu.study.modules.storage.service.FileStorageService;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminCatalogService {

    private final ProgrammeRepository programmeRepository;
    private final CourseRepository courseRepository;
    private final ProgrammeMapper programmeMapper;
    private final CourseMapper courseMapper;
    private final CurrentUserProvider currentUserProvider;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final UserCourseRepository userCourseRepository;
    private final MaterialRepository materialRepository;

    public AdminCatalogService(
        ProgrammeRepository programmeRepository,
        CourseRepository courseRepository,
        ProgrammeMapper programmeMapper,
        CourseMapper courseMapper,
        CurrentUserProvider currentUserProvider,
        FileStorageService fileStorageService,
        UserRepository userRepository,
        UserCourseRepository userCourseRepository,
        MaterialRepository materialRepository
    ) {
        this.programmeRepository = programmeRepository;
        this.courseRepository = courseRepository;
        this.programmeMapper = programmeMapper;
        this.courseMapper = courseMapper;
        this.currentUserProvider = currentUserProvider;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.userCourseRepository = userCourseRepository;
        this.materialRepository = materialRepository;
    }

    @Transactional
    public ProgrammeSummaryResponse createProgramme(CreateProgrammeRequest request) {
        if (programmeRepository.findByCode(request.code()).isPresent()) {
            throw new ApiException("PROGRAMME_CODE_EXISTS", "Programme code already exists");
        }

        Programme programme = new Programme();
        programme.setCode(request.code());
        programme.setName(request.name());
        programme.setStreamName(request.streamName());
        programme.setDescription(request.description());

        return programmeMapper.toSummary(programmeRepository.save(programme));
    }

    @Transactional
    public CourseDetailResponse createCourse(CreateCourseRequest request) {
        Programme programme = programmeRepository.findById(request.programmeId())
            .orElseThrow(() -> new ApiException("PROGRAMME_NOT_FOUND", "Programme not found"));

        StudyUser admin = currentUserProvider.requireCurrentUser();

        Course course = new Course();
        course.setProgramme(programme);
        course.setSemesterNumber(request.semesterNumber());
        course.setName(request.name());
        course.setCode(request.code());
        course.setDescription(request.description());
        course.setStatus(request.status());
        course.setCreatedByAdmin(admin);

        return courseMapper.toDetail(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public List<ProgrammeSummaryResponse> listProgrammes() {
        return programmeRepository.findAllByOrderByNameAsc().stream()
            .map(programmeMapper::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseDetailResponse> listCourses() {
        return courseRepository.findAllByOrderByProgramme_NameAscSemesterNumberAscNameAsc().stream()
            .map(courseMapper::toDetail)
            .toList();
    }

    @Transactional
    public ProgrammeSummaryResponse updateProgramme(Long programmeId, UpdateProgrammeRequest request) {
        if (!request.hasUpdates()) {
            throw new ApiException("VALIDATION_ERROR", "No updates provided");
        }
        Programme programme = programmeRepository.findById(programmeId)
            .orElseThrow(() -> new ApiException("PROGRAMME_NOT_FOUND", "Programme not found"));
        if (request.name() != null) {
            programme.setName(request.name().trim());
        }
        if (request.streamName() != null) {
            programme.setStreamName(request.streamName());
        }
        if (request.description() != null) {
            programme.setDescription(request.description());
        }
        return programmeMapper.toSummary(programmeRepository.save(programme));
    }

    @Transactional
    public void deleteProgramme(Long programmeId) {
        Programme programme = programmeRepository.findById(programmeId)
            .orElseThrow(() -> new ApiException("PROGRAMME_NOT_FOUND", "Programme not found"));
        long courseCount = courseRepository.countByProgramme_Id(programmeId);
        if (courseCount > 0) {
            throw new ApiException(
                "PROGRAMME_HAS_COURSES",
                "Remove or reassign all courses before deleting this programme"
            );
        }
        long userCount = userRepository.countByProgrammeId(programmeId);
        if (userCount > 0) {
            throw new ApiException(
                "PROGRAMME_HAS_USERS",
                "Students are linked to this programme — update their profiles before deleting"
            );
        }
        programmeRepository.delete(programme);
    }

    @Transactional
    public CourseDetailResponse updateCourse(Long courseId, UpdateCourseRequest request) {
        if (!request.hasUpdates()) {
            throw new ApiException("VALIDATION_ERROR", "No updates provided");
        }
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        if (request.programmeId() != null) {
            Programme programme = programmeRepository.findById(request.programmeId())
                .orElseThrow(() -> new ApiException("PROGRAMME_NOT_FOUND", "Programme not found"));
            course.setProgramme(programme);
        }
        if (request.semesterNumber() != null) {
            course.setSemesterNumber(request.semesterNumber());
        }
        if (request.name() != null) {
            course.setName(request.name().trim());
        }
        if (request.code() != null) {
            course.setCode(request.code());
        }
        if (request.description() != null) {
            course.setDescription(request.description());
        }
        if (request.status() != null) {
            course.setStatus(request.status());
        }
        return courseMapper.toDetail(courseRepository.save(course));
    }

    @Transactional
    public CourseDetailResponse updateCourseIcon(Long courseId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ApiException("VALIDATION_ERROR", "Icon file is required");
        }
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        var storedFile = fileStorageService.store(file);
        course.setIconUrl("stored:" + storedFile.getId());
        return courseMapper.toDetail(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        long userCourseCount = userCourseRepository.countByCourse_Id(courseId);
        if (userCourseCount > 0) {
            throw new ApiException(
                "COURSE_HAS_STUDENTS",
                "Students have added this course — hide or archive it instead of deleting"
            );
        }
        long materialCount = materialRepository.countByCourse_IdAndOfficialTrue(courseId);
        if (materialCount > 0) {
            throw new ApiException(
                "COURSE_HAS_MATERIALS",
                "Remove all official materials before deleting this course"
            );
        }
        courseRepository.delete(course);
    }
}
