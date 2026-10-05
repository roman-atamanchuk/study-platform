package ie.setu.study.modules.workspace.model;

import ie.setu.study.common.enums.ActivePanel;
import ie.setu.study.common.enums.WorkspaceViewMode;
import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.user.model.StudyUser;
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
@Table(name = "WorkspaceState")
public class WorkspaceState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userid", nullable = false)
    private StudyUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "courseid", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usercourseid")
    private UserCourse userCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leftmaterialid")
    private Material leftMaterial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rightmaterialid")
    private Material rightMaterial;

    @Column(name = "leftpage")
    private Integer leftPage;

    @Column(name = "rightpage")
    private Integer rightPage;

    @Column(name = "leftscrollposition")
    private Double leftScrollPosition;

    @Column(name = "rightscrollposition")
    private Double rightScrollPosition;

    @Column(name = "leftzoom")
    private Double leftZoom;

    @Column(name = "rightzoom")
    private Double rightZoom;

    @Column(name = "dividerposition")
    private Double dividerPosition;

    @Enumerated(EnumType.STRING)
    @Column(name = "activepanel", length = 10)
    private ActivePanel activePanel;

    @Enumerated(EnumType.STRING)
    @Column(name = "viewmode", nullable = false, length = 10)
    private WorkspaceViewMode viewMode = WorkspaceViewMode.DUAL;

    @Column(name = "updatedat", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public StudyUser getUser() {
        return user;
    }

    public void setUser(StudyUser user) {
        this.user = user;
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

    public Material getLeftMaterial() {
        return leftMaterial;
    }

    public void setLeftMaterial(Material leftMaterial) {
        this.leftMaterial = leftMaterial;
    }

    public Material getRightMaterial() {
        return rightMaterial;
    }

    public void setRightMaterial(Material rightMaterial) {
        this.rightMaterial = rightMaterial;
    }

    public Integer getLeftPage() {
        return leftPage;
    }

    public void setLeftPage(Integer leftPage) {
        this.leftPage = leftPage;
    }

    public Integer getRightPage() {
        return rightPage;
    }

    public void setRightPage(Integer rightPage) {
        this.rightPage = rightPage;
    }

    public Double getLeftScrollPosition() {
        return leftScrollPosition;
    }

    public void setLeftScrollPosition(Double leftScrollPosition) {
        this.leftScrollPosition = leftScrollPosition;
    }

    public Double getRightScrollPosition() {
        return rightScrollPosition;
    }

    public void setRightScrollPosition(Double rightScrollPosition) {
        this.rightScrollPosition = rightScrollPosition;
    }

    public Double getLeftZoom() {
        return leftZoom;
    }

    public void setLeftZoom(Double leftZoom) {
        this.leftZoom = leftZoom;
    }

    public Double getRightZoom() {
        return rightZoom;
    }

    public void setRightZoom(Double rightZoom) {
        this.rightZoom = rightZoom;
    }

    public Double getDividerPosition() {
        return dividerPosition;
    }

    public void setDividerPosition(Double dividerPosition) {
        this.dividerPosition = dividerPosition;
    }

    public ActivePanel getActivePanel() {
        return activePanel;
    }

    public void setActivePanel(ActivePanel activePanel) {
        this.activePanel = activePanel;
    }

    public WorkspaceViewMode getViewMode() {
        return viewMode;
    }

    public void setViewMode(WorkspaceViewMode viewMode) {
        this.viewMode = viewMode;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
