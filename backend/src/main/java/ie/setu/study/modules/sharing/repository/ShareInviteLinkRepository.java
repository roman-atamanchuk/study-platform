package ie.setu.study.modules.sharing.repository;

import ie.setu.study.modules.sharing.model.ShareInviteLink;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShareInviteLinkRepository extends JpaRepository<ShareInviteLink, Long> {

    Optional<ShareInviteLink> findByToken(String token);

    List<ShareInviteLink> findByUserCourse_IdOrderByCreatedAtDesc(Long userCourseId);
}
