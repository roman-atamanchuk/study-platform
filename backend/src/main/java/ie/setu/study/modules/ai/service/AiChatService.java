package ie.setu.study.modules.ai.service;

import ie.setu.study.common.enums.AiModel;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.config.AiProperties;
import ie.setu.study.modules.ai.dto.AiChatRequest;
import ie.setu.study.modules.ai.dto.AiChatResponse;
import ie.setu.study.modules.ai.dto.AiMessageResponse;
import ie.setu.study.modules.ai.model.AiAnswerCache;
import ie.setu.study.modules.ai.model.AiMessage;
import ie.setu.study.modules.ai.model.AiThread;
import ie.setu.study.modules.ai.repository.AiAnswerCacheRepository;
import ie.setu.study.modules.ai.repository.AiMessageRepository;
import ie.setu.study.modules.ai.repository.AiThreadRepository;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.workspace.model.UserCourse;
import ie.setu.study.modules.workspace.service.UserCourseAccessService;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AiChatService {

    private final AiProperties aiProperties;
    private final UserCourseAccessService userCourseAccessService;
    private final MaterialRepository materialRepository;
    private final MaterialPageContextService materialPageContextService;
    private final SolutionContextService solutionContextService;
    private final LearningMaterialContextService learningMaterialContextService;
    private final AiPromptAnalyzer aiPromptAnalyzer;
    private final AiStructuredResponseParser structuredResponseParser;
    private final OpenAiCompatibleClient openAiCompatibleClient;
    private final AiThreadRepository aiThreadRepository;
    private final AiMessageRepository aiMessageRepository;
    private final AiAnswerCacheRepository aiAnswerCacheRepository;

    public AiChatService(
        AiProperties aiProperties,
        UserCourseAccessService userCourseAccessService,
        MaterialRepository materialRepository,
        MaterialPageContextService materialPageContextService,
        SolutionContextService solutionContextService,
        LearningMaterialContextService learningMaterialContextService,
        AiPromptAnalyzer aiPromptAnalyzer,
        AiStructuredResponseParser structuredResponseParser,
        OpenAiCompatibleClient openAiCompatibleClient,
        AiThreadRepository aiThreadRepository,
        AiMessageRepository aiMessageRepository,
        AiAnswerCacheRepository aiAnswerCacheRepository
    ) {
        this.aiProperties = aiProperties;
        this.userCourseAccessService = userCourseAccessService;
        this.materialRepository = materialRepository;
        this.materialPageContextService = materialPageContextService;
        this.solutionContextService = solutionContextService;
        this.learningMaterialContextService = learningMaterialContextService;
        this.aiPromptAnalyzer = aiPromptAnalyzer;
        this.structuredResponseParser = structuredResponseParser;
        this.openAiCompatibleClient = openAiCompatibleClient;
        this.aiThreadRepository = aiThreadRepository;
        this.aiMessageRepository = aiMessageRepository;
        this.aiAnswerCacheRepository = aiAnswerCacheRepository;
    }

    @Transactional(readOnly = true)
    public List<AiMessageResponse> listMessages(Long userCourseId, Long materialId, int pageNumber) {
        AiThread thread = requireThread(userCourseId, materialId, pageNumber).orElse(null);
        if (thread == null) {
            return List.of();
        }
        List<AiMessage> messages = aiMessageRepository.findByThread_IdOrderByCreatedAtAsc(thread.getId());
        String lastUserPrompt = "";
        List<AiMessageResponse> responses = new java.util.ArrayList<>();
        for (AiMessage message : messages) {
            if ("USER".equals(message.getRole())) {
                lastUserPrompt = message.getContent();
                responses.add(toResponse(message));
                continue;
            }
            responses.add(toAssistantResponse(message, lastUserPrompt));
        }
        return responses;
    }

    public void clearHistory(Long userCourseId, Long materialId, int pageNumber) {
        userCourseAccessService.requireOwnedUserCourse(userCourseId);
        requireThread(userCourseId, materialId, pageNumber).ifPresent(thread -> {
            aiMessageRepository.deleteByThread_Id(thread.getId());
            aiThreadRepository.delete(thread);
        });
    }

    public AiChatResponse chat(Long userCourseId, AiChatRequest request) {
        UserCourse userCourse = userCourseAccessService.requireOwnedUserCourse(userCourseId);
        Material material = materialRepository.findById(request.materialId())
            .orElseThrow(() -> new ApiException("MATERIAL_NOT_FOUND", "Material not found"));
        if (!material.getCourse().getId().equals(userCourse.getCourse().getId())) {
            throw new ApiException("ACCESS_DENIED", "Material does not belong to this course");
        }

        String normalizedPrompt = AiPromptNormalizer.normalize(request.prompt());
        ParsedPrompt parsed = aiPromptAnalyzer.analyze(request.prompt());

        MaterialPageContextService.MaterialPageContext examContext = materialPageContextService.buildContext(
            material,
            request.pageNumber()
        );

        Optional<Material> solutionMaterial = solutionContextService.resolveSolutionMaterial(
            material,
            request.rightMaterialId()
        );
        MaterialPageContextService.MaterialPageContext solutionContext = solutionMaterial
            .map(solution -> materialPageContextService.buildContext(
                solution,
                request.rightPageNumber() != null ? request.rightPageNumber() : request.pageNumber()
            ))
            .orElse(null);

        LearningMaterialContextService.LearningMaterialContext learningContext =
            learningMaterialContextService.buildContext(
                userCourse,
                examContext.textSummary(),
                parsed
            );

        AiTutorRequestContext tutorContext = new AiTutorRequestContext(
            examContext,
            solutionContext,
            learningContext,
            parsed,
            request.prompt().trim()
        );

        AiThread thread = aiThreadRepository
            .findByUserCourse_IdAndMaterial_IdAndPageNumber(userCourseId, material.getId(), examContext.pageNumber())
            .orElseGet(() -> {
                AiThread created = new AiThread();
                created.setUserCourse(userCourse);
                created.setMaterial(material);
                created.setPageNumber(examContext.pageNumber());
                return aiThreadRepository.save(created);
            });

        List<AiMessage> priorMessages = aiMessageRepository.findByThread_IdOrderByCreatedAtAsc(thread.getId());

        String modelId = request.model().name();
        Long solutionMaterialId = solutionMaterial.map(Material::getId).orElse(null);
        String cacheKey = AiPromptNormalizer.cacheKey(
            userCourse.getCourse().getId(),
            material.getId(),
            examContext.pageNumber(),
            modelId,
            normalizedPrompt,
            parsed.intent().name(),
            parsed.question().cacheKey(),
            solutionMaterialId
        );

        Optional<AiAnswerCache> cached = aiAnswerCacheRepository.findByCacheKey(cacheKey);
        String markdown;
        String visualsJson;
        AiAnswerCache cacheEntry;
        boolean fromCache;
        if (cached.isPresent()) {
            cacheEntry = cached.get();
            cacheEntry.incrementHitCount();
            fromCache = true;
            markdown = cacheEntry.getAnswerBody();
            visualsJson = cacheEntry.getVisualsJson();
            if (markdown != null && markdown.trim().startsWith("{")) {
                AiStructuredResponse structured = structuredResponseParser.parse(
                    markdown,
                    parsed,
                    request.prompt()
                );
                if (!structured.markdown().isBlank()) {
                    markdown = structured.markdown();
                }
                if (visualsJson == null && structured.hasVisuals()) {
                    visualsJson = structured.visualsJson();
                }
            }
        } else {
            String raw = callProvider(request.model(), userCourse, tutorContext, priorMessages);
            AiStructuredResponse structured = structuredResponseParser.parse(raw, parsed, request.prompt());
            markdown = structured.markdown();
            visualsJson = structured.visualsJson();
            cacheEntry = new AiAnswerCache();
            cacheEntry.setCacheKey(cacheKey);
            cacheEntry.setCourse(userCourse.getCourse());
            cacheEntry.setMaterial(material);
            cacheEntry.setPageNumber(examContext.pageNumber());
            cacheEntry.setModelId(modelId);
            cacheEntry.setPromptNormalized(normalizedPrompt);
            cacheEntry.setAnswerBody(markdown);
            cacheEntry.setVisualsJson(visualsJson);
            cacheEntry.setHitCount(1);
            cacheEntry = aiAnswerCacheRepository.save(cacheEntry);
            fromCache = false;
        }

        AiMessage userMessage = new AiMessage();
        userMessage.setThread(thread);
        userMessage.setRole("USER");
        userMessage.setContent(request.prompt().trim());
        userMessage.setCached(false);
        aiMessageRepository.save(userMessage);

        AiMessage assistantMessage = new AiMessage();
        assistantMessage.setThread(thread);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(markdown);
        assistantMessage.setVisualsJson(visualsJson);
        assistantMessage.setModelId(modelId);
        assistantMessage.setAnswerCache(cacheEntry);
        assistantMessage.setCached(fromCache);
        aiMessageRepository.save(assistantMessage);

        return new AiChatResponse(
            thread.getId(),
            toResponse(userMessage),
            toResponse(assistantMessage),
            normalizedPrompt,
            parsed.question().label(),
            solutionMaterial.map(Material::getTitle).orElse(null)
        );
    }

    private String callProvider(
        AiModel model,
        UserCourse userCourse,
        AiTutorRequestContext tutorContext,
        List<AiMessage> priorMessages
    ) {
        List<OpenAiCompatibleClient.ChatTurn> history = priorMessages.stream()
            .map(message -> new OpenAiCompatibleClient.ChatTurn(
                message.getRole().toLowerCase(),
                message.getContent()
            ))
            .toList();

        String systemPrompt = AiTutorRules.systemPrompt(
            userCourse.getCourse().getName(),
            userCourse.getCourse().getCode(),
            tutorContext.parsed(),
            tutorContext.hasSolution(),
            tutorContext.hasLearningMaterials()
        );

        return switch (model) {
            case CHATGPT -> openAiCompatibleClient.chatCompletion(
                aiProperties.openaiBaseUrl(),
                aiProperties.openaiApiKey(),
                aiProperties.openaiModel(),
                systemPrompt,
                history,
                tutorContext
            );
            case DEEPSEEK -> openAiCompatibleClient.chatCompletion(
                aiProperties.deepseekBaseUrl(),
                aiProperties.deepseekApiKey(),
                aiProperties.deepseekModel(),
                systemPrompt,
                history,
                tutorContext
            );
        };
    }

    private Optional<AiThread> requireThread(Long userCourseId, Long materialId, int pageNumber) {
        userCourseAccessService.requireAccessibleUserCourse(userCourseId);
        return aiThreadRepository.findByUserCourse_IdAndMaterial_IdAndPageNumber(userCourseId, materialId, pageNumber);
    }

    private AiMessageResponse toResponse(AiMessage message) {
        return new AiMessageResponse(
            message.getId(),
            message.getRole(),
            message.getContent(),
            message.getVisualsJson(),
            message.getModelId(),
            message.isCached(),
            message.getCreatedAt()
        );
    }

    private AiMessageResponse toAssistantResponse(AiMessage message, String userPrompt) {
        if (message.getVisualsJson() != null && !message.getVisualsJson().isBlank()) {
            return toResponse(message);
        }
        String content = message.getContent();
        if (content != null && content.trim().startsWith("{")) {
            AiStructuredResponse structured = structuredResponseParser.parse(
                content,
                aiPromptAnalyzer.analyze(userPrompt),
                userPrompt
            );
            if (structured.hasVisuals()) {
                String markdown = structured.markdown().isBlank() ? content : structured.markdown();
                return new AiMessageResponse(
                    message.getId(),
                    message.getRole(),
                    markdown,
                    structured.visualsJson(),
                    message.getModelId(),
                    message.isCached(),
                    message.getCreatedAt()
                );
            }
        }
        return toResponse(message);
    }
}
