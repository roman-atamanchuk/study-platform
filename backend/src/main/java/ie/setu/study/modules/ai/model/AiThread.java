package ie.setu.study.modules.ai.model;

import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.workspace.model.UserCourse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "AiThread")
public class AiThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usercourseid", nullable = false)
    private UserCourse userCourse;

    @ManyToOne(optional = false)
    @JoinColumn(name = "materialid", nullable = false)
    private Material material;

    @Column(name = "pagenumber", nullable = false)
    private int pageNumber;

    @Column(name = "createdat", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updatedat", nullable = false)
    private OffsetDateTime updatedAt;

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

    public UserCourse getUserCourse() {
        return userCourse;
    }

    public void setUserCourse(UserCourse userCourse) {
        this.userCourse = userCourse;
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

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
