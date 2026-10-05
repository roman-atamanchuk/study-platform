package ie.setu.study.modules.ai.repository;

import ie.setu.study.modules.ai.model.AiAnswerCache;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAnswerCacheRepository extends JpaRepository<AiAnswerCache, Long> {

    Optional<AiAnswerCache> findByCacheKey(String cacheKey);
}
