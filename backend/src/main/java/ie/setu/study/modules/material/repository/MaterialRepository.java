package ie.setu.study.modules.material.repository;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.material.model.Material;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    long countByOfficialTrue();

    long countByCourse_IdAndOfficialTrue(Long courseId);

    long countByCourse_IdAndOfficialTrueAndVisibility(Long courseId, MaterialVisibility visibility);

    long countByStoredFileId(Long storedFileId);

    @Query("""
        SELECT COUNT(m) FROM Material m
        WHERE m.storedFile.id = :storedFileId OR m.previewStoredFile.id = :storedFileId
        """)
    long countReferencesToStoredFile(@Param("storedFileId") Long storedFileId);

    List<Material> findByCourse_IdAndOfficialTrueAndDeletedAtIsNullOrderByDisplayOrderAscCreatedAtDesc(Long courseId);

    List<Material> findByCourse_IdAndVisibilityAndDeletedAtIsNullOrderByDisplayOrderAscCreatedAtDesc(
        Long courseId,
        MaterialVisibility visibility
    );

    @Query("""
        SELECT m FROM Material m
        WHERE m.course.id = :courseId
        AND m.deletedAt IS NULL
        AND (
            m.visibility = ie.setu.study.common.enums.MaterialVisibility.PUBLIC
            OR m.userCourse.id = :userCourseId
            OR (:sourceUserCourseId IS NOT NULL
                AND m.userCourse.id = :sourceUserCourseId
                AND m.visibility = ie.setu.study.common.enums.MaterialVisibility.SHARED)
        )
        ORDER BY m.displayOrder ASC, m.createdAt DESC
        """)
    List<Material> findAccessibleForUserCourse(
        @Param("courseId") Long courseId,
        @Param("userCourseId") Long userCourseId,
        @Param("sourceUserCourseId") Long sourceUserCourseId
    );

    List<Material> findByUserCourseIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long userCourseId);

    List<Material> findByUserCourseIdOrderByDisplayOrderAscCreatedAtDesc(Long userCourseId);

    List<Material> findByUserCourseIdAndMaterialTypeOrderByDisplayOrderAscCreatedAtDesc(
        Long userCourseId,
        MaterialType materialType
    );

    List<Material> findByParentExamMaterial_IdAndMaterialTypeAndDeletedAtIsNullOrderByOfficialDescCreatedAtDesc(
        Long parentExamMaterialId,
        MaterialType materialType
    );

    List<Material> findByCourse_IdAndMaterialTypeAndYearAndDeletedAtIsNullAndParentExamMaterialIsNullOrderByOfficialDescCreatedAtDesc(
        Long courseId,
        MaterialType materialType,
        Integer year
    );
}
