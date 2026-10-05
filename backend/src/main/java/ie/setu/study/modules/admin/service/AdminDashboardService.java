package ie.setu.study.modules.admin.service;

import ie.setu.study.modules.admin.dto.AdminDashboardResponse;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.programme.repository.ProgrammeRepository;
import ie.setu.study.modules.user.repository.UserRepository;
import ie.setu.study.modules.workspace.repository.UserCourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ProgrammeRepository programmeRepository;
    private final CourseRepository courseRepository;
    private final MaterialRepository materialRepository;
    private final UserCourseRepository userCourseRepository;

    public AdminDashboardService(
        UserRepository userRepository,
        ProgrammeRepository programmeRepository,
        CourseRepository courseRepository,
        MaterialRepository materialRepository,
        UserCourseRepository userCourseRepository
    ) {
        this.userRepository = userRepository;
        this.programmeRepository = programmeRepository;
        this.courseRepository = courseRepository;
        this.materialRepository = materialRepository;
        this.userCourseRepository = userCourseRepository;
    }

    public AdminDashboardResponse getDashboard() {
        return new AdminDashboardResponse(
            userRepository.count(),
            programmeRepository.count(),
            courseRepository.count(),
            materialRepository.countByOfficialTrue(),
            userCourseRepository.countByArchivedFalse()
        );
    }
}
