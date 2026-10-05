package ie.setu.study.modules.course.repository;

import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.modules.course.model.Course;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByProgrammeIdAndStatusOrderBySemesterNumberAscNameAsc(Long programmeId, CourseStatus status);

    List<Course> findByProgrammeIdAndSemesterNumberAndStatusOrderByNameAsc(
        Long programmeId,
        Integer semesterNumber,
        CourseStatus status
    );

    @Query("""
        SELECT c FROM Course c
        WHERE c.status = :status
          AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY c.name ASC
        """)
    List<Course> searchPublished(@Param("query") String query, @Param("status") CourseStatus status);

    List<Course> findAllByOrderByProgramme_NameAscSemesterNumberAscNameAsc();

    long countByProgramme_Id(Long programmeId);
}
