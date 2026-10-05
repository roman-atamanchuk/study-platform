package ie.setu.study.modules.ai.repository;

import ie.setu.study.modules.ai.model.AiThread;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiThreadRepository extends JpaRepository<AiThread, Long> {

    Optional<AiThread> findByUserCourse_IdAndMaterial_IdAndPageNumber(
        Long userCourseId,
        Long materialId,
        int pageNumber
    );
}
