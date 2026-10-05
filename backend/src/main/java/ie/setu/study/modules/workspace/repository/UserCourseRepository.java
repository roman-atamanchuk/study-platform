package ie.setu.study.modules.workspace.repository;

import ie.setu.study.modules.workspace.model.UserCourse;
import java.util.List;
import java.util.Optional;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCourseRepository extends JpaRepository<UserCourse, Long> {

    List<UserCourse> findByUser_IdAndArchivedFalseOrderByAddedAtDesc(Long userId);

    List<UserCourse> findByUser_IdAndArchivedTrueOrderByAddedAtDesc(Long userId);

    Optional<UserCourse> findByUser_IdAndCourse_IdAndArchivedFalse(Long userId, Long courseId);

    boolean existsByUser_IdAndCourse_IdAndArchivedFalse(Long userId, Long courseId);

    Optional<UserCourse> findByUser_IdAndSourceUserCourse_IdAndArchivedFalse(
        Long userId,
        Long sourceUserCourseId
    );

    long countByArchivedFalse();

    long countByCourse_Id(Long courseId);
}
