package ie.setu.study.modules.workspace.model;

import ie.setu.study.modules.material.model.Material;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "UserCourseHiddenMaterial")
public class UserCourseHiddenMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usercourseid", nullable = false)
    private UserCourse userCourse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materialid", nullable = false)
    private Material material;

    @Column(name = "hiddenat", nullable = false)
    private OffsetDateTime hiddenAt;

    @PrePersist
    void onCreate() {
        if (hiddenAt == null) {
            hiddenAt = OffsetDateTime.now();
        }
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

    public OffsetDateTime getHiddenAt() {
        return hiddenAt;
    }

    public void setHiddenAt(OffsetDateTime hiddenAt) {
        this.hiddenAt = hiddenAt;
    }
}
