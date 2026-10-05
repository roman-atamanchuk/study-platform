package ie.setu.study.modules.workspace.repository;

import ie.setu.study.modules.workspace.model.WorkspaceState;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkspaceStateRepository extends JpaRepository<WorkspaceState, Long> {

    Optional<WorkspaceState> findByUser_IdAndUserCourse_Id(Long userId, Long userCourseId);

    @Query("""
        SELECT ws FROM WorkspaceState ws
        WHERE ws.leftMaterial.id = :materialId OR ws.rightMaterial.id = :materialId
        """)
    List<WorkspaceState> findAllReferencingMaterial(@Param("materialId") Long materialId);
}
