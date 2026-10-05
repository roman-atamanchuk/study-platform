package ie.setu.study.modules.admin.controller;

import ie.setu.study.modules.admin.service.AdminCatalogService;
import ie.setu.study.modules.course.dto.CreateCourseRequest;
import ie.setu.study.modules.course.dto.CourseDetailResponse;
import ie.setu.study.modules.course.dto.UpdateCourseRequest;
import ie.setu.study.modules.programme.dto.CreateProgrammeRequest;
import ie.setu.study.modules.programme.dto.ProgrammeSummaryResponse;
import ie.setu.study.modules.programme.dto.UpdateProgrammeRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
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

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {

    private final AdminCatalogService adminCatalogService;

    public AdminCatalogController(AdminCatalogService adminCatalogService) {
        this.adminCatalogService = adminCatalogService;
    }

    @GetMapping("/programmes")
    public List<ProgrammeSummaryResponse> listProgrammes() {
        return adminCatalogService.listProgrammes();
    }

    @PostMapping("/programmes")
    @ResponseStatus(HttpStatus.CREATED)
    public ProgrammeSummaryResponse createProgramme(@Valid @RequestBody CreateProgrammeRequest request) {
        return adminCatalogService.createProgramme(request);
    }

    @PatchMapping("/programmes/{programmeId}")
    public ProgrammeSummaryResponse updateProgramme(
        @PathVariable Long programmeId,
        @Valid @RequestBody UpdateProgrammeRequest request
    ) {
        return adminCatalogService.updateProgramme(programmeId, request);
    }

    @DeleteMapping("/programmes/{programmeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProgramme(@PathVariable Long programmeId) {
        adminCatalogService.deleteProgramme(programmeId);
    }

    @GetMapping("/courses")
    public List<CourseDetailResponse> listCourses() {
        return adminCatalogService.listCourses();
    }

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseDetailResponse createCourse(@Valid @RequestBody CreateCourseRequest request) {
        return adminCatalogService.createCourse(request);
    }

    @PatchMapping("/courses/{courseId}")
    public CourseDetailResponse updateCourse(
        @PathVariable Long courseId,
        @Valid @RequestBody UpdateCourseRequest request
    ) {
        return adminCatalogService.updateCourse(courseId, request);
    }

    @PatchMapping(value = "/courses/{courseId}/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CourseDetailResponse updateCourseIcon(
        @PathVariable Long courseId,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        return adminCatalogService.updateCourseIcon(courseId, file);
    }

    @DeleteMapping("/courses/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCourse(@PathVariable Long courseId) {
        adminCatalogService.deleteCourse(courseId);
    }
}
