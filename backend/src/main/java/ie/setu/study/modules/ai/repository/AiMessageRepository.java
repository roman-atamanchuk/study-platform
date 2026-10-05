package ie.setu.study.modules.ai.repository;

import ie.setu.study.modules.ai.model.AiMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByThread_IdOrderByCreatedAtAsc(Long threadId);

    void deleteByThread_Id(Long threadId);
}
