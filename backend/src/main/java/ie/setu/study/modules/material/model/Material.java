package ie.setu.study.modules.material.model;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.enums.MaterialVisibility;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.workspace.model.UserCourse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "Material")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "courseid", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usercourseid")
    private UserCourse userCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploadedbyuserid")
    private StudyUser uploadedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "storedfileid")
    private StoredFile storedFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previewstoredfileid")
    private StoredFile previewStoredFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parentexammaterialid")
    private Material parentExamMaterial;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "materialtype", nullable = false, length = 30)
    private MaterialType materialType;

    @Column(name = "\"year\"")
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaterialVisibility visibility = MaterialVisibility.PRIVATE;

    @Column(name = "displayorder")
    private Integer displayOrder;

    @Column(name = "isofficial", nullable = false)
    private boolean official;

    @Column(name = "externalurl")
    private String externalUrl;

    @Column(name = "videoid", length = 128)
    private String videoId;

    @Column(name = "thumbnailurl")
    private String thumbnailUrl;

    @Column(name = "htmlbody", columnDefinition = "TEXT")
    private String htmlBody;

    @Column(name = "createdat", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updatedat", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deletedat")
    private OffsetDateTime deletedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public UserCourse getUserCourse() {
        return userCourse;
    }

    public void setUserCourse(UserCourse userCourse) {
        this.userCourse = userCourse;
    }

    public StudyUser getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(StudyUser uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public StoredFile getStoredFile() {
        return storedFile;
    }

    public void setStoredFile(StoredFile storedFile) {
        this.storedFile = storedFile;
    }

    public StoredFile getPreviewStoredFile() {
        return previewStoredFile;
    }

    public void setPreviewStoredFile(StoredFile previewStoredFile) {
        this.previewStoredFile = previewStoredFile;
    }

    public Material getParentExamMaterial() {
        return parentExamMaterial;
    }

    public void setParentExamMaterial(Material parentExamMaterial) {
        this.parentExamMaterial = parentExamMaterial;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public MaterialType getMaterialType() {
        return materialType;
    }

    public void setMaterialType(MaterialType materialType) {
        this.materialType = materialType;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public MaterialVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(MaterialVisibility visibility) {
        this.visibility = visibility;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isOfficial() {
        return official;
    }

    public void setOfficial(boolean official) {
        this.official = official;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getHtmlBody() {
        return htmlBody;
    }

    public void setHtmlBody(String htmlBody) {
        this.htmlBody = htmlBody;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(OffsetDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
