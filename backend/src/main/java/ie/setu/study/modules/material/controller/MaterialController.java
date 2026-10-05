package ie.setu.study.modules.material.controller;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.material.dto.AddNoteMaterialRequest;
import ie.setu.study.modules.material.dto.AddVideoMaterialRequest;
import ie.setu.study.modules.material.dto.MaterialBoardResponse;
import ie.setu.study.modules.material.dto.MaterialResponse;
import ie.setu.study.modules.material.dto.TrashMaterialResponse;
import ie.setu.study.modules.material.dto.UpdateMaterialOrderRequest;
import ie.setu.study.modules.material.dto.UpdateMaterialRequest;
import ie.setu.study.modules.material.dto.UpdateMaterialVisibilityRequest;
import ie.setu.study.modules.material.service.MaterialService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping("/my-courses/{userCourseId}/materials")
    public List<MaterialResponse> listMaterials(@PathVariable Long userCourseId) {
        return materialService.listMaterials(userCourseId);
    }

    @GetMapping("/my-courses/{userCourseId}/material-board")
    public MaterialBoardResponse materialBoard(@PathVariable Long userCourseId) {
        return materialService.materialBoard(userCourseId);
    }

    @GetMapping("/my-courses/{userCourseId}/images")
    public List<MaterialResponse> listImages(@PathVariable Long userCourseId) {
        return materialService.listImages(userCourseId);
    }

    @GetMapping("/my-courses/{userCourseId}/videos")
    public List<MaterialResponse> listVideos(@PathVariable Long userCourseId) {
        return materialService.listVideos(userCourseId);
    }

    @PostMapping(value = "/my-courses/{userCourseId}/materials/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse uploadMaterial(
        @PathVariable Long userCourseId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam(value = "visibility", required = false) MaterialVisibility visibility,
        @RequestParam(value = "parentExamMaterialId", required = false) Long parentExamMaterialId,
        @RequestParam(value = "year", required = false) Integer year,
        @RequestParam(value = "description", required = false) String description
    ) throws IOException {
        return materialService.uploadMaterial(userCourseId, file, title, visibility, parentExamMaterialId, year, description);
    }

    @PostMapping("/my-courses/{userCourseId}/materials/video")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse addVideo(
        @PathVariable Long userCourseId,
        @Valid @RequestBody AddVideoMaterialRequest request
    ) {
        return materialService.addVideo(userCourseId, request);
    }

    @PostMapping("/my-courses/{userCourseId}/materials/note")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse addNote(
        @PathVariable Long userCourseId,
        @Valid @RequestBody AddNoteMaterialRequest request
    ) {
        return materialService.addNote(userCourseId, request);
    }

    @GetMapping("/my-courses/{userCourseId}/materials/trash")
    public List<TrashMaterialResponse> listTrash(@PathVariable Long userCourseId) {
        return materialService.listTrash(userCourseId);
    }

    @DeleteMapping("/my-courses/{userCourseId}/materials/trash")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearTrash(@PathVariable Long userCourseId) {
        materialService.clearTrash(userCourseId);
    }

    @PostMapping("/my-courses/{userCourseId}/hidden-materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hideOfficialMaterial(
        @PathVariable Long userCourseId,
        @PathVariable Long materialId
    ) {
        materialService.hideOfficialMaterial(userCourseId, materialId);
    }

    @PostMapping("/materials/{materialId}/restore")
    public MaterialResponse restoreMaterial(
        @PathVariable Long materialId,
        @RequestParam Long userCourseId
    ) {
        return materialService.restoreMaterial(userCourseId, materialId);
    }

    @DeleteMapping("/materials/{materialId}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void permanentlyDeleteMaterial(@PathVariable Long materialId) {
        materialService.permanentlyDeleteMaterial(materialId);
    }

    @PatchMapping("/materials/{materialId}")
    public MaterialResponse updateMaterial(
        @PathVariable Long materialId,
        @Valid @RequestBody UpdateMaterialRequest request
    ) {
        return materialService.updateMaterial(materialId, request);
    }

    @PatchMapping("/materials/{materialId}/visibility")
    public MaterialResponse updateVisibility(
        @PathVariable Long materialId,
        @Valid @RequestBody UpdateMaterialVisibilityRequest request
    ) {
        return materialService.updateVisibility(materialId, request);
    }

    @PatchMapping("/materials/{materialId}/order")
    public MaterialResponse updateOrder(
        @PathVariable Long materialId,
        @Valid @RequestBody UpdateMaterialOrderRequest request
    ) {
        return materialService.updateOrder(materialId, request);
    }

    @DeleteMapping("/materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMaterial(@PathVariable Long materialId) {
        materialService.deleteMaterial(materialId);
    }

    @GetMapping("/materials/{materialId}/download")
    public ResponseEntity<Resource> downloadMaterial(@PathVariable Long materialId) {
        MaterialService.DownloadPayload payload = materialService.downloadMaterial(materialId);
        return fileResponse(payload, "attachment");
    }

    @GetMapping("/materials/{materialId}/view")
    public ResponseEntity<Resource> viewMaterial(@PathVariable Long materialId) {
        MaterialService.DownloadPayload payload = materialService.viewMaterial(materialId);
        return fileResponse(payload, "inline");
    }

    private ResponseEntity<Resource> fileResponse(MaterialService.DownloadPayload payload, String dispositionType) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + payload.filename() + "\"")
            .contentType(MediaType.parseMediaType(payload.contentType()))
            .body(payload.resource());
    }
}
