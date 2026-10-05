package ie.setu.study.config;

import ie.setu.study.common.enums.UserRole;
import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.storage.service.FileStorageService;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("dev")
public class DevOfficialMaterialSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevOfficialMaterialSeeder.class);

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public DevOfficialMaterialSeeder(
        MaterialRepository materialRepository,
        CourseRepository courseRepository,
        UserRepository userRepository,
        FileStorageService fileStorageService
    ) {
        this.materialRepository = materialRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (materialRepository.countByOfficialTrue() > 0) {
            return;
        }

        StudyUser admin = userRepository.findFirstByRole(UserRole.ADMIN).orElse(null);
        List<Course> courses = courseRepository.findAllByOrderByProgramme_NameAscSemesterNumberAscNameAsc();
        int created = 0;

        for (Course course : courses) {
            if (course.getStatus() != CourseStatus.PUBLISHED) {
                continue;
            }
            created += seedCourseMaterials(course, admin);
        }

        log.info("Seeded {} official study materials for local dev preview", created);
    }

    private int seedCourseMaterials(Course course, StudyUser admin) throws IOException {
        String code = course.getCode() == null ? "COURSE" : course.getCode();
        int order = 0;
        int count = 0;

        Material exam2024 = saveMaterial(course, admin, code + " Exam 2024", MaterialType.EXAM_PAPER, 2024, order++,
            null,
            List.of(
                code + " — Official Exam Paper 2024",
                "Section A: Answer all questions.",
                "Section B: Show your working."
            ));
        count += 1;
        saveMaterial(course, admin, code + " Solution 2024", MaterialType.SOLUTION, 2024, order++,
            exam2024,
            List.of(
                code + " — Official Marking Scheme 2024",
                "Question 1: model answer and marks.",
                "Question 2: model answer and marks."
            ));
        count += 1;

        Material exam2023 = saveMaterial(course, admin, code + " Exam 2023", MaterialType.EXAM_PAPER, 2023, order++,
            null,
            List.of(
                code + " — Official Exam Paper 2023",
                "Past paper for revision.",
                "Use with the matching solution."
            ));
        count += 1;
        saveMaterial(course, admin, code + " Solution 2023", MaterialType.SOLUTION, 2023, order++,
            exam2023,
            List.of(
                code + " — Official Marking Scheme 2023",
                "Past paper solutions.",
                "Compare with your attempt."
            ));
        count += 1;

        saveMaterial(course, admin, code + " Lecture Notes", MaterialType.LEARNING_MATERIAL, 2024, order,
            null,
            List.of(
                course.getName() + " — Learning material",
                "Week 1 overview",
                "Key definitions and examples"
            ));
        count += 1;
        return count;
    }

    private Material saveMaterial(
        Course course,
        StudyUser admin,
        String title,
        MaterialType type,
        int year,
        int displayOrder,
        Material parentExam,
        List<String> pageLines
    ) throws IOException {
        byte[] pdf = SamplePdfFactory.createStudyDocument(title, pageLines);
        String filename = title.toLowerCase().replace(' ', '-') + ".pdf";

        Material material = new Material();
        material.setCourse(course);
        material.setUploadedBy(admin);
        material.setStoredFile(fileStorageService.storeBytes(pdf, filename, "application/pdf"));
        material.setTitle(title);
        material.setDescription("Sample official material for local study preview.");
        material.setMaterialType(type);
        material.setYear(year);
        material.setVisibility(MaterialVisibility.PUBLIC);
        material.setDisplayOrder(displayOrder);
        material.setOfficial(true);
        if (parentExam != null) {
            material.setParentExamMaterial(parentExam);
        }
        return materialRepository.save(material);
    }
}
