package ie.setu.study.modules.workspace.controller;

import ie.setu.study.modules.workspace.dto.AddUserCourseRequest;
import ie.setu.study.modules.workspace.dto.UpdateUserCourseRequest;
import ie.setu.study.modules.workspace.dto.UserCourseResponse;
import ie.setu.study.modules.workspace.service.UserCourseService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserCourseController {

    private final UserCourseService userCourseService;

    public UserCourseController(UserCourseService userCourseService) {
        this.userCourseService = userCourseService;
    }

    @GetMapping("/my-courses")
    public List<UserCourseResponse> listActive() {
        return userCourseService.listActive();
    }

    @GetMapping("/my-courses/archived")
    public List<UserCourseResponse> listArchived() {
        return userCourseService.listArchived();
    }

    @PostMapping("/my-courses")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public UserCourseResponse addCourse(@Valid @RequestBody AddUserCourseRequest request) {
        return userCourseService.addCourse(request);
    }

    @PostMapping("/my-courses/{userCourseId}/archive")
    public UserCourseResponse archive(@PathVariable Long userCourseId) {
        return userCourseService.archive(userCourseId);
    }

    @PostMapping("/my-courses/{userCourseId}/unarchive")
    public UserCourseResponse unarchive(@PathVariable Long userCourseId) {
        return userCourseService.unarchive(userCourseId);
    }

    @PatchMapping("/my-courses/{userCourseId}")
    public UserCourseResponse updateUserCourse(
        @PathVariable Long userCourseId,
        @Valid @RequestBody UpdateUserCourseRequest request
    ) {
        return userCourseService.updateDisplayName(userCourseId, request);
    }

    @GetMapping("/my-courses/{userCourseId}")
    public UserCourseResponse getUserCourse(@PathVariable Long userCourseId) {
        return userCourseService.getUserCourse(userCourseId);
    }
}
