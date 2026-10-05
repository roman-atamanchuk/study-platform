package ie.setu.study.modules.workspace.repository;

import ie.setu.study.modules.workspace.model.UserCourseHiddenMaterial;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCourseHiddenMaterialRepository extends JpaRepository<UserCourseHiddenMaterial, Long> {

    List<UserCourseHiddenMaterial> findByUserCourse_IdOrderByHiddenAtDesc(Long userCourseId);

    Optional<UserCourseHiddenMaterial> findByUserCourse_IdAndMaterial_Id(Long userCourseId, Long materialId);

    boolean existsByUserCourse_IdAndMaterial_Id(Long userCourseId, Long materialId);

    void deleteByUserCourse_IdAndMaterial_Id(Long userCourseId, Long materialId);

    void deleteByMaterial_Id(Long materialId);

    List<UserCourseHiddenMaterial> findByMaterial_Id(Long materialId);

    @Query("""
        SELECT h.material.id FROM UserCourseHiddenMaterial h
        WHERE h.userCourse.id = :userCourseId
        """)
    Set<Long> findHiddenMaterialIdsByUserCourseId(@Param("userCourseId") Long userCourseId);
}
