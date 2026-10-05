package ie.setu.study.modules.sharing.model;

import ie.setu.study.modules.user.model.StudyUser;
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
@Table(name = "SharedCourseAccess")
public class SharedCourseAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usercourseid", nullable = false)
    private UserCourse userCourse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sharedwithuserid", nullable = false)
    private StudyUser sharedWithUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shareinvitelinkid")
    private ShareInviteLink shareInviteLink;

    @Column(name = "createdat", nullable = false)
    private OffsetDateTime createdAt;

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

    public StudyUser getSharedWithUser() {
        return sharedWithUser;
    }

    public void setSharedWithUser(StudyUser sharedWithUser) {
        this.sharedWithUser = sharedWithUser;
    }

    public ShareInviteLink getShareInviteLink() {
        return shareInviteLink;
    }

    public void setShareInviteLink(ShareInviteLink shareInviteLink) {
        this.shareInviteLink = shareInviteLink;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(OffsetDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public boolean isActive() {
        return revokedAt == null;
    }
}
