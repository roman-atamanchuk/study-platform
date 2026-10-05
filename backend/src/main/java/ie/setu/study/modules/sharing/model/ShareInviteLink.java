package ie.setu.study.modules.sharing.model;

import ie.setu.study.modules.workspace.model.UserCourse;
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
@Table(name = "ShareInviteLink")
public class ShareInviteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usercourseid", nullable = false)
    private UserCourse userCourse;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(length = 128)
    private String label;

    @Column(name = "createdat", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expiresat")
    private OffsetDateTime expiresAt;

    @Column(name = "revokedat")
    private OffsetDateTime revokedAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
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

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(OffsetDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public boolean isActive() {
        if (revokedAt != null) {
            return false;
        }
        return expiresAt == null || expiresAt.isAfter(OffsetDateTime.now());
    }
}
