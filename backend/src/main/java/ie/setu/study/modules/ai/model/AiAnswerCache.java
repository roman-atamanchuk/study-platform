package ie.setu.study.modules.ai.model;

import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.material.model.Material;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "AiAnswerCache")
public class AiAnswerCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String cacheKey;

    @ManyToOne(optional = false)
    @JoinColumn(name = "courseid", nullable = false)
    private Course course;

    @ManyToOne(optional = false)
    @JoinColumn(name = "materialid", nullable = false)
    private Material material;

    @Column(name = "pagenumber", nullable = false)
    private int pageNumber;

    @Column(name = "modelid", nullable = false, length = 32)
    private String modelId;

    @Column(name = "promptnormalized", nullable = false, columnDefinition = "TEXT")
    private String promptNormalized;

    @Column(name = "answerbody", nullable = false, columnDefinition = "TEXT")
    private String answerBody;

    @Column(name = "visualsjson", columnDefinition = "TEXT")
    private String visualsJson;

    @Column(name = "hitcount", nullable = false)
    private long hitCount;

    @Column(name = "createdat", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getCacheKey() {
        return cacheKey;
    }

    public void setCacheKey(String cacheKey) {
        this.cacheKey = cacheKey;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public String getModelId() {
        return modelId;
    }

    public void setModelId(String modelId) {
        this.modelId = modelId;
    }

    public String getPromptNormalized() {
        return promptNormalized;
    }

    public void setPromptNormalized(String promptNormalized) {
        this.promptNormalized = promptNormalized;
    }

    public String getAnswerBody() {
        return answerBody;
    }

    public void setAnswerBody(String answerBody) {
        this.answerBody = answerBody;
    }

    public String getVisualsJson() {
        return visualsJson;
    }

    public void setVisualsJson(String visualsJson) {
        this.visualsJson = visualsJson;
    }

    public long getHitCount() {
        return hitCount;
    }

    public void setHitCount(long hitCount) {
        this.hitCount = hitCount;
    }

    public void incrementHitCount() {
        this.hitCount += 1;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
