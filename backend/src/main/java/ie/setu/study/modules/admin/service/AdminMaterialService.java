package ie.setu.study.modules.admin.service;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.material.dto.AddOfficialVideoMaterialRequest;
import ie.setu.study.modules.material.dto.MaterialResponse;
import ie.setu.study.modules.material.mapper.MaterialMapper;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.common.util.MaterialTitles;
import ie.setu.study.common.util.MaterialYears;
import ie.setu.study.modules.conversion.service.DocumentConversionService;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.modules.storage.service.FileStorageService;
import ie.setu.study.modules.user.model.StudyUser;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class AdminMaterialService {

    private final CourseRepository courseRepository;
    private final MaterialRepository materialRepository;
    private final FileStorageService fileStorageService;
    private final DocumentConversionService documentConversionService;
    private final CurrentUserProvider currentUserProvider;

    public AdminMaterialService(
        CourseRepository courseRepository,
        MaterialRepository materialRepository,
        FileStorageService fileStorageService,
        DocumentConversionService documentConversionService,
        CurrentUserProvider currentUserProvider
    ) {
        this.courseRepository = courseRepository;
        this.materialRepository = materialRepository;
        this.fileStorageService = fileStorageService;
        this.documentConversionService = documentConversionService;
        this.currentUserProvider = currentUserProvider;
    }

    public MaterialResponse uploadOfficialMaterial(
        Long courseId,
        MultipartFile file,
        String title,
        MaterialType materialType,
        MaterialVisibility visibility,
        Integer year,
        String description,
        Integer displayOrder,
        Long parentExamMaterialId
    ) throws IOException {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        if (file == null || file.isEmpty()) {
            throw new ApiException("VALIDATION_ERROR", "File is required");
        }
        if (materialType == null) {
            throw new ApiException("VALIDATION_ERROR", "Material type is required");
        }
        if (materialType == MaterialType.SOLUTION && parentExamMaterialId == null) {
            throw new ApiException("VALIDATION_ERROR", "Solutions must be linked to an exam paper");
        }
        if (materialType == MaterialType.MY_MATERIAL || materialType == MaterialType.NOTE) {
            throw new ApiException("VALIDATION_ERROR", "Official uploads cannot use personal material types");
        }

        StudyUser admin = currentUserProvider.requireCurrentUser();
        StoredFile storedFile = fileStorageService.store(file);

        Material material = new Material();
        material.setCourse(course);
        material.setUploadedBy(admin);
        material.setStoredFile(storedFile);
        documentConversionService.createPdfPreview(storedFile).ifPresent(material::setPreviewStoredFile);
        material.setTitle(MaterialTitles.resolve(title, file));
        material.setDescription(description);
        material.setMaterialType(materialType);
        material.setVisibility(visibility == null ? MaterialVisibility.PUBLIC : visibility);
        material.setDisplayOrder(displayOrder);
        material.setOfficial(true);

        Material parentExam = resolveOfficialParentExamPaper(parentExamMaterialId, course.getId(), materialType);
        if (parentExam != null) {
            material.setParentExamMaterial(parentExam);
            material.setYear(parentExam.getYear());
        } else {
            material.setYear(MaterialYears.resolve(year, file));
        }

        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse addOfficialVideo(Long courseId, AddOfficialVideoMaterialRequest request) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        StudyUser admin = currentUserProvider.requireCurrentUser();

        Material material = new Material();
        material.setCourse(course);
        material.setUploadedBy(admin);
        material.setTitle(request.title().trim());
        material.setDescription(request.description());
        material.setMaterialType(MaterialType.VIDEO);
        material.setVideoId(request.videoId());
        material.setThumbnailUrl(
            request.thumbnailUrl() != null && !request.thumbnailUrl().isBlank()
                ? request.thumbnailUrl()
                : "https://img.youtube.com/vi/" + request.videoId() + "/hqdefault.jpg"
        );
        material.setExternalUrl("https://www.youtube.com/watch?v=" + request.videoId());
        material.setVisibility(request.visibility() == null ? MaterialVisibility.PUBLIC : request.visibility());
        material.setYear(request.year());
        material.setOfficial(true);

        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    private Material resolveOfficialParentExamPaper(
        Long parentExamMaterialId,
        Long courseId,
        MaterialType materialType
    ) {
        if (parentExamMaterialId == null) {
            return null;
        }
        if (materialType != MaterialType.SOLUTION && materialType != MaterialType.OTHER) {
            throw new ApiException("VALIDATION_ERROR", "Only solutions and other official types can link to an exam paper");
        }
        return resolveParentExamPaper(parentExamMaterialId, courseId);
    }

    private Material resolveParentExamPaper(Long parentExamMaterialId, Long courseId) {
        if (parentExamMaterialId == null) {
            return null;
        }
        Material exam = materialRepository.findById(parentExamMaterialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Exam paper not found"));
        if (!exam.isOfficial() || exam.getMaterialType() != MaterialType.EXAM_PAPER) {
            throw new ApiException("VALIDATION_ERROR", "Parent must be an official exam paper");
        }
        if (exam.getDeletedAt() != null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Exam paper not found");
        }
        if (!exam.getCourse().getId().equals(courseId)) {
            throw new ApiException("ACCESS_DENIED", "Exam paper belongs to another course");
        }
        return exam;
    }

    @Transactional(readOnly = true)
    public List<MaterialResponse> listOfficialMaterials(Long courseId) {
        courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        return materialRepository.findByCourse_IdAndOfficialTrueAndDeletedAtIsNullOrderByDisplayOrderAscCreatedAtDesc(courseId)
            .stream()
            .map(MaterialMapper::toResponse)
            .toList();
    }

    public void deleteOfficialMaterial(Long materialId) {
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (!material.isOfficial()) {
            throw new ApiException("ACCESS_DENIED", "Only official materials can be deleted here");
        }
        StoredFile storedFile = material.getStoredFile();
        StoredFile previewStoredFile = material.getPreviewStoredFile();
        materialRepository.delete(material);
        releaseStoredFileIfUnreferenced(storedFile);
        releaseStoredFileIfUnreferenced(previewStoredFile);
    }

    private void releaseStoredFileIfUnreferenced(StoredFile storedFile) {
        if (storedFile != null && materialRepository.countReferencesToStoredFile(storedFile.getId()) == 0) {
            fileStorageService.deleteIfUnreferenced(storedFile);
        }
    }

    public MaterialResponse updateOfficialVisibility(Long materialId, MaterialVisibility visibility) {
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (!material.isOfficial()) {
            throw new ApiException("ACCESS_DENIED", "Only official materials can be moderated here");
        }
        material.setVisibility(visibility);
        return MaterialMapper.toResponse(materialRepository.save(material));
    }
}
