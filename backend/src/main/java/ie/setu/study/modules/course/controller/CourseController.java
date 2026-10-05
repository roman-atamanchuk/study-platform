package ie.setu.study.modules.course.controller;

import ie.setu.study.modules.course.dto.CourseDetailResponse;
import ie.setu.study.modules.course.dto.CourseSummaryResponse;
import ie.setu.study.modules.course.service.CourseService;
import ie.setu.study.modules.material.dto.MaterialBoardResponse;
import ie.setu.study.modules.material.service.MaterialService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;
    private final MaterialService materialService;

    public CourseController(CourseService courseService, MaterialService materialService) {
        this.courseService = courseService;
        this.materialService = materialService;
    }

    @GetMapping("/search")
    public List<CourseSummaryResponse> searchCourses(@RequestParam("q") String query) {
        return courseService.searchCourses(query);
    }

    @GetMapping("/{id}")
    public CourseDetailResponse getCourse(@PathVariable Long id) {
        return courseService.getCourse(id);
    }

    @GetMapping("/{id}/material-board")
    public MaterialBoardResponse getPublicMaterialBoard(@PathVariable Long id) {
        return materialService.publicMaterialBoard(id);
    }

    @GetMapping("/{id}/icon")
    public ResponseEntity<Resource> getCourseIcon(@PathVariable Long id) {
        CourseService.IconPayload payload = courseService.getCourseIcon(id);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(payload.contentType()))
            .body(payload.resource());
    }
}
