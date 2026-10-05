package ie.setu.study.modules.admin.controller;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.admin.dto.AdminDashboardResponse;
import ie.setu.study.modules.admin.service.AdminDashboardService;
import ie.setu.study.modules.admin.service.AdminMaterialService;
import ie.setu.study.modules.material.dto.AddOfficialVideoMaterialRequest;
import ie.setu.study.modules.material.dto.MaterialResponse;
import ie.setu.study.modules.material.dto.UpdateMaterialVisibilityRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMaterialController {

    private final AdminDashboardService adminDashboardService;
    private final AdminMaterialService adminMaterialService;

    public AdminMaterialController(
        AdminDashboardService adminDashboardService,
        AdminMaterialService adminMaterialService
    ) {
        this.adminDashboardService = adminDashboardService;
        this.adminMaterialService = adminMaterialService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return adminDashboardService.getDashboard();
    }

    @GetMapping("/courses/{courseId}/materials")
    public List<MaterialResponse> listOfficialMaterials(@PathVariable Long courseId) {
        return adminMaterialService.listOfficialMaterials(courseId);
    }

    @PostMapping(value = "/courses/{courseId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse uploadOfficialMaterial(
        @PathVariable Long courseId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam("materialType") MaterialType materialType,
        @RequestParam(value = "visibility", required = false) MaterialVisibility visibility,
        @RequestParam(value = "year", required = false) Integer year,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "displayOrder", required = false) Integer displayOrder,
        @RequestParam(value = "parentExamMaterialId", required = false) Long parentExamMaterialId
    ) throws IOException {
        return adminMaterialService.uploadOfficialMaterial(
            courseId, file, title, materialType, visibility, year, description, displayOrder, parentExamMaterialId
        );
    }

    @PostMapping("/courses/{courseId}/materials/video")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse addOfficialVideo(
        @PathVariable Long courseId,
        @Valid @RequestBody AddOfficialVideoMaterialRequest request
    ) {
        return adminMaterialService.addOfficialVideo(courseId, request);
    }

    @PatchMapping("/materials/{materialId}/visibility")
    public MaterialResponse moderateVisibility(
        @PathVariable Long materialId,
        @Valid @RequestBody UpdateMaterialVisibilityRequest request
    ) {
        return adminMaterialService.updateOfficialVisibility(materialId, request.visibility());
    }

    @DeleteMapping("/materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOfficialMaterial(@PathVariable Long materialId) {
        adminMaterialService.deleteOfficialMaterial(materialId);
    }
}
