package ie.setu.study.modules.ai.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "AiMessage")
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "threadid", nullable = false)
    private AiThread thread;

    @Column(nullable = false, length = 16)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "modelid", length = 32)
    private String modelId;

    @ManyToOne
    @JoinColumn(name = "answercacheid")
    private AiAnswerCache answerCache;

    @Column(nullable = false)
    private boolean cached;

    @Column(name = "visualsjson", columnDefinition = "TEXT")
    private String visualsJson;

    @Column(name = "createdat", nullable = false)
    private java.time.OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = java.time.OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public AiThread getThread() {
        return thread;
    }

    public void setThread(AiThread thread) {
        this.thread = thread;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getModelId() {
        return modelId;
    }

    public void setModelId(String modelId) {
        this.modelId = modelId;
    }

    public AiAnswerCache getAnswerCache() {
        return answerCache;
    }

    public void setAnswerCache(AiAnswerCache answerCache) {
        this.answerCache = answerCache;
    }

    public boolean isCached() {
        return cached;
    }

    public void setCached(boolean cached) {
        this.cached = cached;
    }

    public String getVisualsJson() {
        return visualsJson;
    }

    public void setVisualsJson(String visualsJson) {
        this.visualsJson = visualsJson;
    }

    public java.time.OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
