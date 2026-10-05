package ie.setu.study.modules.storage.repository;

import ie.setu.study.modules.storage.model.StoredFile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    Optional<StoredFile> findBySha256Hash(String sha256Hash);
}
