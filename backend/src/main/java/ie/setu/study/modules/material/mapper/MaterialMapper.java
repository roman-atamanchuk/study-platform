package ie.setu.study.modules.material.mapper;

import ie.setu.study.common.util.OfficeFormats;
import ie.setu.study.modules.material.dto.MaterialResponse;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.storage.model.StoredFile;

public final class MaterialMapper {

    private MaterialMapper() {}

    public static MaterialResponse toResponse(Material material) {
        StoredFile storedFile = material.getStoredFile();
        boolean pdfPreviewAvailable = material.getPreviewStoredFile() != null
            || (storedFile != null && OfficeFormats.isPdf(storedFile.getOriginalFilename(), storedFile.getMimeType()));
        return new MaterialResponse(
            material.getId(),
            material.getCourse().getId(),
            material.getUserCourse() == null ? null : material.getUserCourse().getId(),
            material.getTitle(),
            material.getDescription(),
            material.getMaterialType(),
            material.getYear(),
            material.getVisibility(),
            material.getDisplayOrder(),
            material.isOfficial(),
            material.getExternalUrl(),
            material.getVideoId(),
            material.getThumbnailUrl(),
            storedFile == null ? null : storedFile.getOriginalFilename(),
            storedFile == null ? null : storedFile.getMimeType(),
            storedFile == null ? null : storedFile.getFileSize(),
            pdfPreviewAvailable,
            material.getCreatedAt(),
            material.getDeletedAt(),
            material.getParentExamMaterial() == null ? null : material.getParentExamMaterial().getId(),
            material.getHtmlBody()
        );
    }
}
