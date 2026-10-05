package ie.setu.study.modules.material.service;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.common.enums.UserRole;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.material.dto.AddNoteMaterialRequest;
import ie.setu.study.modules.material.dto.AddVideoMaterialRequest;
import ie.setu.study.modules.material.dto.MaterialBoardResponse;
import ie.setu.study.modules.material.dto.MaterialResponse;
import ie.setu.study.modules.material.dto.TrashMaterialResponse;
import ie.setu.study.modules.material.dto.UpdateMaterialOrderRequest;
import ie.setu.study.modules.material.dto.UpdateMaterialRequest;
import ie.setu.study.modules.material.dto.UpdateMaterialVisibilityRequest;
import ie.setu.study.modules.material.util.NoteHtmlSanitizer;
import ie.setu.study.modules.material.mapper.MaterialMapper;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.common.enums.CourseStatus;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.course.repository.CourseRepository;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.common.util.MaterialTitles;
import ie.setu.study.common.util.MaterialYears;
import ie.setu.study.common.util.OfficeFormats;
import ie.setu.study.modules.conversion.service.DocumentConversionService;
import ie.setu.study.modules.storage.service.FileStorageService;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.model.UserCourseHiddenMaterial;
import ie.setu.study.modules.workspace.model.WorkspaceState;
import ie.setu.study.modules.workspace.repository.UserCourseHiddenMaterialRepository;
import ie.setu.study.modules.workspace.repository.WorkspaceStateRepository;
import ie.setu.study.modules.workspace.service.UserCourseAccessService;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final FileStorageService fileStorageService;
    private final DocumentConversionService documentConversionService;
    private final UserCourseAccessService userCourseAccessService;
    private final WorkspaceStateRepository workspaceStateRepository;
    private final UserCourseHiddenMaterialRepository hiddenMaterialRepository;
    private final CurrentUserProvider currentUserProvider;

    public MaterialService(
        MaterialRepository materialRepository,
        CourseRepository courseRepository,
        FileStorageService fileStorageService,
        DocumentConversionService documentConversionService,
        UserCourseAccessService userCourseAccessService,
        WorkspaceStateRepository workspaceStateRepository,
        UserCourseHiddenMaterialRepository hiddenMaterialRepository,
        CurrentUserProvider currentUserProvider
    ) {
        this.materialRepository = materialRepository;
        this.courseRepository = courseRepository;
        this.fileStorageService = fileStorageService;
        this.documentConversionService = documentConversionService;
        this.userCourseAccessService = userCourseAccessService;
        this.workspaceStateRepository = workspaceStateRepository;
        this.hiddenMaterialRepository = hiddenMaterialRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public List<MaterialResponse> listMaterials(Long userCourseId) {
        UserCourse userCourse = userCourseAccessService.requireAccessibleUserCourse(userCourseId);
        return findAccessible(userCourse).stream().map(MaterialMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MaterialBoardResponse publicMaterialBoard(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", "Course not found"));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ApiException("COURSE_HIDDEN", "Course is not publicly available");
        }
        List<MaterialResponse> materials = materialRepository
            .findByCourse_IdAndVisibilityAndDeletedAtIsNullOrderByDisplayOrderAscCreatedAtDesc(
                courseId,
                MaterialVisibility.PUBLIC
            )
            .stream()
            .map(MaterialMapper::toResponse)
            .toList();
        return groupMaterialBoard(materials);
    }

    @Transactional(readOnly = true)
    public MaterialBoardResponse materialBoard(Long userCourseId) {
        return groupMaterialBoard(listMaterials(userCourseId));
    }

    private MaterialBoardResponse groupMaterialBoard(List<MaterialResponse> materials) {
        Map<MaterialType, List<MaterialResponse>> grouped = new EnumMap<>(MaterialType.class);
        for (MaterialType type : MaterialType.values()) {
            grouped.put(type, new ArrayList<>());
        }
        for (MaterialResponse material : materials) {
            grouped.get(material.materialType()).add(material);
        }
        return new MaterialBoardResponse(
            grouped.get(MaterialType.EXAM_PAPER),
            grouped.get(MaterialType.SOLUTION),
            grouped.get(MaterialType.LEARNING_MATERIAL),
            grouped.get(MaterialType.IMAGE),
            grouped.get(MaterialType.VIDEO),
            grouped.get(MaterialType.OTHER),
            mergeLists(grouped.get(MaterialType.MY_MATERIAL), grouped.get(MaterialType.NOTE))
        );
    }

    private static List<MaterialResponse> mergeLists(
        List<MaterialResponse> first,
        List<MaterialResponse> second
    ) {
        List<MaterialResponse> merged = new ArrayList<>(first.size() + second.size());
        merged.addAll(first);
        merged.addAll(second);
        return merged;
    }

    @Transactional(readOnly = true)
    public List<MaterialResponse> listImages(Long userCourseId) {
        return listMaterials(userCourseId).stream()
            .filter(m -> m.materialType() == MaterialType.IMAGE)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MaterialResponse> listVideos(Long userCourseId) {
        return listMaterials(userCourseId).stream()
            .filter(m -> m.materialType() == MaterialType.VIDEO)
            .toList();
    }

    public MaterialResponse uploadMaterial(
        Long userCourseId,
        MultipartFile file,
        String title,
        MaterialVisibility visibility,
        Long parentExamMaterialId,
        Integer year,
        String description
    ) throws IOException {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        StudyUser user = currentUserProvider.requireCurrentUser();
        if (file == null || file.isEmpty()) {
            throw new ApiException("VALIDATION_ERROR", "File is required");
        }

        StoredFile storedFile = fileStorageService.store(file);
        Material material = new Material();
        material.setCourse(userCourse.getCourse());
        material.setUserCourse(userCourse);
        material.setUploadedBy(user);
        material.setStoredFile(storedFile);
        documentConversionService.createPdfPreview(storedFile).ifPresent(material::setPreviewStoredFile);
        material.setTitle(MaterialTitles.resolve(title, file));
        material.setDescription(description);
        material.setMaterialType(MaterialType.MY_MATERIAL);
        material.setVisibility(resolveUploadVisibility(visibility));
        material.setOfficial(false);

        Material parentExam = resolveParentExamPaper(parentExamMaterialId, userCourse.getCourse().getId());
        if (parentExam != null) {
            material.setParentExamMaterial(parentExam);
            material.setYear(parentExam.getYear());
        } else {
            material.setYear(year);
        }

        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse addVideo(Long userCourseId, AddVideoMaterialRequest request) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        StudyUser user = currentUserProvider.requireCurrentUser();

        Material material = new Material();
        material.setCourse(userCourse.getCourse());
        material.setUserCourse(userCourse);
        material.setUploadedBy(user);
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
        material.setVisibility(resolveUploadVisibility(request.visibility()));
        material.setOfficial(false);

        Material parentExam = resolveParentExamPaper(request.parentExamMaterialId(), userCourse.getCourse().getId());
        if (parentExam != null) {
            material.setParentExamMaterial(parentExam);
            material.setYear(parentExam.getYear());
        } else {
            material.setYear(request.year());
        }

        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse addNote(Long userCourseId, AddNoteMaterialRequest request) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        StudyUser user = currentUserProvider.requireCurrentUser();

        String htmlBody;
        try {
            htmlBody = NoteHtmlSanitizer.sanitize(request.htmlBody());
        } catch (IllegalArgumentException ex) {
            throw new ApiException("VALIDATION_ERROR", ex.getMessage());
        }

        Material material = new Material();
        material.setCourse(userCourse.getCourse());
        material.setUserCourse(userCourse);
        material.setUploadedBy(user);
        material.setTitle(request.title().trim());
        material.setMaterialType(MaterialType.NOTE);
        material.setHtmlBody(htmlBody);
        material.setVisibility(resolveUploadVisibility(request.visibility()));
        material.setOfficial(false);

        Material parentExam = resolveParentExamPaper(request.parentExamMaterialId(), userCourse.getCourse().getId());
        if (parentExam == null) {
            throw new ApiException("VALIDATION_ERROR", "Notes must be linked to an official exam paper");
        }
        material.setParentExamMaterial(parentExam);
        material.setYear(parentExam.getYear());

        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse updateMaterial(Long materialId, UpdateMaterialRequest request) {
        Material material = requireOwnedPersonalMaterial(materialId);
        if (!request.hasUpdates()) {
            throw new ApiException("VALIDATION_ERROR", "No updates provided");
        }
        if (request.title() != null) {
            material.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            material.setDescription(request.description());
        }
        if (request.year() != null) {
            material.setYear(request.year());
        }
        if (request.htmlBody() != null) {
            if (material.getMaterialType() != MaterialType.NOTE) {
                throw new ApiException("VALIDATION_ERROR", "Only notes can update htmlBody");
            }
            try {
                material.setHtmlBody(NoteHtmlSanitizer.sanitize(request.htmlBody()));
            } catch (IllegalArgumentException ex) {
                throw new ApiException("VALIDATION_ERROR", ex.getMessage());
            }
        }
        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse updateVisibility(Long materialId, UpdateMaterialVisibilityRequest request) {
        Material material = requireOwnedPersonalMaterial(materialId);
        material.setVisibility(resolveUploadVisibility(request.visibility()));
        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    public MaterialResponse updateOrder(Long materialId, UpdateMaterialOrderRequest request) {
        Material material = requireOwnedPersonalMaterial(materialId);
        material.setDisplayOrder(request.displayOrder());
        return MaterialMapper.toResponse(materialRepository.save(material));
    }

    @Transactional(readOnly = true)
    public List<TrashMaterialResponse> listTrash(Long userCourseId) {
        userCourseAccessService.requireOwnedUserCourse(userCourseId);
        StudyUser user = currentUserProvider.requireCurrentUser();
        boolean admin = user.getRole() == UserRole.ADMIN;
        List<TrashMaterialResponse> items = new ArrayList<>();

        materialRepository.findByUserCourseIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(userCourseId)
            .stream()
            .filter(material -> !material.isOfficial())
            .forEach(material -> items.add(new TrashMaterialResponse(
                MaterialMapper.toResponse(material),
                material.getDeletedAt(),
                true
            )));

        hiddenMaterialRepository.findByUserCourse_IdOrderByHiddenAtDesc(userCourseId)
            .forEach(hidden -> {
                Material material = hidden.getMaterial();
                items.add(new TrashMaterialResponse(
                    MaterialMapper.toResponse(material),
                    hidden.getHiddenAt(),
                    admin && canAdminDeleteFromCatalog(material)
                ));
            });

        items.sort(Comparator.comparing(TrashMaterialResponse::trashedAt).reversed());
        return items;
    }

    public void clearTrash(Long userCourseId) {
        userCourseAccessService.requireOwnedUserCourse(userCourseId);
        StudyUser user = currentUserProvider.requireCurrentUser();
        boolean admin = user.getRole() == UserRole.ADMIN;

        if (admin) {
            List<UserCourseHiddenMaterial> hidden = hiddenMaterialRepository
                .findByUserCourse_IdOrderByHiddenAtDesc(userCourseId);
            for (UserCourseHiddenMaterial entry : hidden) {
                Material material = entry.getMaterial();
                if (canAdminDeleteFromCatalog(material)) {
                    permanentlyDeleteCatalogMaterial(material);
                }
            }
        }

        List<Material> trashed = materialRepository.findByUserCourseIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(userCourseId)
            .stream()
            .filter(material -> !material.isOfficial())
            .toList();
        for (Material material : trashed) {
            permanentlyDelete(material);
        }
    }

    public MaterialResponse restoreMaterial(Long userCourseId, Long materialId) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));

        if (hiddenMaterialRepository.existsByUserCourse_IdAndMaterial_Id(userCourseId, materialId)) {
            if (!material.isOfficial()) {
                throw new ApiException("ACCESS_DENIED", "Material is not hidden as official content");
            }
            if (!material.getCourse().getId().equals(userCourse.getCourse().getId())) {
                throw new ApiException("ACCESS_DENIED", "Material does not belong to this course");
            }
            hiddenMaterialRepository.deleteByUserCourse_IdAndMaterial_Id(userCourseId, materialId);
            return MaterialMapper.toResponse(material);
        }

        Material ownedTrashed = requireOwnedTrashedMaterial(materialId);
        ownedTrashed.setDeletedAt(null);
        return MaterialMapper.toResponse(materialRepository.save(ownedTrashed));
    }

    public void permanentlyDeleteMaterial(Long materialId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (user.getRole() == UserRole.ADMIN && canAdminDeleteFromCatalog(material)) {
            permanentlyDeleteCatalogMaterial(material);
            return;
        }
        Material ownedTrashed = requireOwnedTrashedMaterial(materialId);
        permanentlyDelete(ownedTrashed);
    }

    public void hideOfficialMaterial(Long userCourseId, Long materialId) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (!material.isOfficial()) {
            throw new ApiException("ACCESS_DENIED", "Only official materials can be hidden here");
        }
        if (material.getDeletedAt() != null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Material not found");
        }
        if (!material.getCourse().getId().equals(userCourse.getCourse().getId())) {
            throw new ApiException("ACCESS_DENIED", "Material does not belong to this course");
        }
        if (material.getVisibility() != MaterialVisibility.PUBLIC) {
            throw new ApiException("ACCESS_DENIED", "Material is not available in this workspace");
        }
        if (hiddenMaterialRepository.existsByUserCourse_IdAndMaterial_Id(userCourseId, materialId)) {
            return;
        }

        UserCourseHiddenMaterial hidden = new UserCourseHiddenMaterial();
        hidden.setUserCourse(userCourse);
        hidden.setMaterial(material);
        hiddenMaterialRepository.save(hidden);
        clearWorkspaceReferencesForUserCourse(userCourseId, materialId);
    }

    public void deleteMaterial(Long materialId) {
        Material material = requireOwnedPersonalMaterial(materialId);
        clearWorkspaceReferences(materialId);
        material.setDeletedAt(OffsetDateTime.now());
        materialRepository.save(material);
    }

    private void permanentlyDelete(Material material) {
        Long materialId = material.getId();
        StoredFile storedFile = material.getStoredFile();
        StoredFile previewStoredFile = material.getPreviewStoredFile();
        clearWorkspaceReferences(materialId);
        materialRepository.delete(material);
        releaseStoredFileIfUnreferenced(storedFile);
        releaseStoredFileIfUnreferenced(previewStoredFile);
    }

    private void permanentlyDeleteCatalogMaterial(Material material) {
        hiddenMaterialRepository.deleteByMaterial_Id(material.getId());
        permanentlyDelete(material);
    }

    private boolean canAdminDeleteFromCatalog(Material material) {
        if (material.getDeletedAt() != null) {
            return true;
        }
        return material.isOfficial() || material.getVisibility() == MaterialVisibility.PUBLIC;
    }

    private void clearWorkspaceReferencesForUserCourse(Long userCourseId, Long materialId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        workspaceStateRepository.findByUser_IdAndUserCourse_Id(user.getId(), userCourseId)
            .ifPresent(state -> {
                boolean changed = false;
                if (state.getLeftMaterial() != null && materialId.equals(state.getLeftMaterial().getId())) {
                    state.setLeftMaterial(null);
                    state.setLeftPage(1);
                    changed = true;
                }
                if (state.getRightMaterial() != null && materialId.equals(state.getRightMaterial().getId())) {
                    state.setRightMaterial(null);
                    state.setRightPage(1);
                    changed = true;
                }
                if (changed) {
                    workspaceStateRepository.save(state);
                }
            });
    }

    private void clearWorkspaceReferences(Long materialId) {
        List<WorkspaceState> states = workspaceStateRepository.findAllReferencingMaterial(materialId);
        if (states.isEmpty()) {
            return;
        }
        for (WorkspaceState state : states) {
            if (state.getLeftMaterial() != null && materialId.equals(state.getLeftMaterial().getId())) {
                state.setLeftMaterial(null);
                state.setLeftPage(1);
            }
            if (state.getRightMaterial() != null && materialId.equals(state.getRightMaterial().getId())) {
                state.setRightMaterial(null);
                state.setRightPage(1);
            }
        }
        workspaceStateRepository.saveAll(states);
    }

    @Transactional(readOnly = true)
    public DownloadPayload downloadMaterial(Long materialId) {
        Material material = requireAccessibleMaterial(materialId);
        return payloadForStoredFile(material.getStoredFile());
    }

    @Transactional(readOnly = true)
    public DownloadPayload viewMaterial(Long materialId) {
        Material material = requireAccessibleMaterial(materialId);
        StoredFile preview = material.getPreviewStoredFile();
        if (preview != null) {
            StoredFile original = material.getStoredFile();
            String filename = original == null
                ? preview.getOriginalFilename()
                : OfficeFormats.pdfPreviewFilename(original.getOriginalFilename());
            return payloadForFile(preview, filename, "application/pdf");
        }
        return payloadForStoredFile(material.getStoredFile());
    }

    private DownloadPayload payloadForStoredFile(StoredFile storedFile) {
        if (storedFile == null) {
            throw new ApiException("NO_FILE", "This material has no downloadable file");
        }
        return payloadForFile(storedFile, storedFile.getOriginalFilename(), storedFile.getMimeType());
    }

    private DownloadPayload payloadForFile(StoredFile storedFile, String filename, String contentType) {
        if (storedFile == null) {
            throw new ApiException("NO_FILE", "This material has no downloadable file");
        }
        try {
            Resource resource = new UrlResource(fileStorageService.resolvePath(storedFile).toUri());
            if (!resource.exists()) {
                throw new ApiException("FILE_NOT_FOUND", "Stored file is missing");
            }
            return new DownloadPayload(resource, filename, contentType);
        } catch (IOException exception) {
            throw new ApiException("FILE_NOT_FOUND", "Unable to read stored file");
        }
    }

    private void releaseStoredFileIfUnreferenced(StoredFile storedFile) {
        if (storedFile != null && materialRepository.countReferencesToStoredFile(storedFile.getId()) == 0) {
            fileStorageService.deleteIfUnreferenced(storedFile);
        }
    }

    private List<Material> findAccessible(UserCourse userCourse) {
        Long sourceId = userCourse.getSourceUserCourse() == null
            ? null
            : userCourse.getSourceUserCourse().getId();
        Set<Long> hiddenIds = hiddenMaterialRepository.findHiddenMaterialIdsByUserCourseId(userCourse.getId());
        return materialRepository.findAccessibleForUserCourse(
            userCourse.getCourse().getId(),
            userCourse.getId(),
            sourceId
        ).stream()
            .filter(material -> !hiddenIds.contains(material.getId()))
            .toList();
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

    private Material requireOwnedPersonalMaterial(Long materialId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (material.getDeletedAt() != null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Material not found");
        }
        if (material.isOfficial() || material.getUserCourse() == null) {
            throw new ApiException("ACCESS_DENIED", "Cannot modify official materials");
        }
        if (!material.getUserCourse().getUser().getId().equals(user.getId())) {
            throw new ApiException("ACCESS_DENIED", "You do not own this material");
        }
        return material;
    }

    private Material requireOwnedTrashedMaterial(Long materialId) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (material.getDeletedAt() == null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Material is not in trash");
        }
        if (material.isOfficial() || material.getUserCourse() == null) {
            throw new ApiException("ACCESS_DENIED", "Cannot modify official materials");
        }
        if (!material.getUserCourse().getUser().getId().equals(user.getId())) {
            throw new ApiException("ACCESS_DENIED", "You do not own this material");
        }
        return material;
    }

    private Material requireAccessibleMaterial(Long materialId) {
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (material.getDeletedAt() != null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Material not found");
        }
        StudyUser user = currentUserProvider.getCurrentUserOrNull();
        if (user != null && user.getRole() == UserRole.ADMIN) {
            return material;
        }
        if (material.getVisibility() == MaterialVisibility.PUBLIC) {
            if (user == null && material.getCourse().getStatus() != CourseStatus.PUBLISHED) {
                throw new ApiException("ACCESS_DENIED", "Material is not accessible");
            }
            return material;
        }
        if (material.getUserCourse() == null) {
            throw new ApiException("ACCESS_DENIED", "Material is not accessible");
        }
        userCourseAccessService.requireAccessibleUserCourse(material.getUserCourse().getId());
        return material;
    }

    private MaterialVisibility resolveUploadVisibility(MaterialVisibility visibility) {
        MaterialVisibility resolved = visibility == null ? MaterialVisibility.SHARED : visibility;
        if (resolved == MaterialVisibility.PUBLIC) {
            StudyUser user = currentUserProvider.requireCurrentUser();
            if (user.getRole() != UserRole.ADMIN) {
                throw new ApiException("ACCESS_DENIED", "Only admins can publish materials to the public course");
            }
        }
        return resolved;
    }

    public record DownloadPayload(Resource resource, String filename, String contentType) {}
}
