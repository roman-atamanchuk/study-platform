package ie.setu.study.modules.sharing.repository;

import ie.setu.study.modules.sharing.model.SharedCourseAccess;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SharedCourseAccessRepository extends JpaRepository<SharedCourseAccess, Long> {

    List<SharedCourseAccess> findBySharedWithUser_IdAndRevokedAtIsNullOrderByCreatedAtDesc(Long userId);

    Optional<SharedCourseAccess> findByUserCourse_IdAndSharedWithUser_IdAndRevokedAtIsNull(
        Long userCourseId,
        Long sharedWithUserId
    );

    boolean existsByUserCourse_IdAndSharedWithUser_IdAndRevokedAtIsNull(Long userCourseId, Long sharedWithUserId);
}
