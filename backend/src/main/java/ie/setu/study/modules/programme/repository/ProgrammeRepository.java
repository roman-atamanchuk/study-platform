package ie.setu.study.modules.programme.repository;

import ie.setu.study.modules.programme.model.Programme;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgrammeRepository extends JpaRepository<Programme, Long> {

    Optional<Programme> findByCode(String code);

    List<Programme> findAllByOrderByNameAsc();
}
