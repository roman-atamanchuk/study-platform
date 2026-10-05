package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import java.time.OffsetDateTime;

public record MaterialResponse(
    Long id,
    Long courseId,
    Long userCourseId,
    String title,
    String description,
    MaterialType materialType,
    Integer year,
    MaterialVisibility visibility,
    Integer displayOrder,
    boolean official,
    String externalUrl,
    String videoId,
    String thumbnailUrl,
    String originalFilename,
    String mimeType,
    Long fileSize,
    boolean pdfPreviewAvailable,
    OffsetDateTime createdAt,
    OffsetDateTime deletedAt,
    Long parentExamMaterialId,
    String htmlBody
) {}
