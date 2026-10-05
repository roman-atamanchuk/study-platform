package ie.setu.study.modules.user.repository;

import ie.setu.study.common.enums.UserRole;
import ie.setu.study.modules.user.model.StudyUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<StudyUser, Long> {

    Optional<StudyUser> findByEmail(String email);

    Optional<StudyUser> findFirstByRole(UserRole role);

    Optional<StudyUser> findByStudentNumber(String studentNumber);

    boolean existsByEmail(String email);

    boolean existsByStudentNumber(String studentNumber);

    long countByProgrammeId(Long programmeId);
}
