package ie.setu.study.modules.ai.controller;

import ie.setu.study.modules.ai.dto.AiChatRequest;
import ie.setu.study.modules.ai.dto.AiChatResponse;
import ie.setu.study.modules.ai.dto.AiMessageResponse;
import ie.setu.study.modules.ai.service.AiChatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/my-courses/{userCourseId}/ai/chat")
    public AiChatResponse chat(@PathVariable Long userCourseId, @Valid @RequestBody AiChatRequest request) {
        return aiChatService.chat(userCourseId, request);
    }

    @GetMapping("/my-courses/{userCourseId}/ai/messages")
    public List<AiMessageResponse> messages(
        @PathVariable Long userCourseId,
        @RequestParam Long materialId,
        @RequestParam int pageNumber
    ) {
        return aiChatService.listMessages(userCourseId, materialId, pageNumber);
    }

    @DeleteMapping("/my-courses/{userCourseId}/ai/history")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearHistory(
        @PathVariable Long userCourseId,
        @RequestParam Long materialId,
        @RequestParam int pageNumber
    ) {
        aiChatService.clearHistory(userCourseId, materialId, pageNumber);
    }
}
