package ie.setu.study.modules.workspace.model;

import ie.setu.study.modules.course.model.Course;
import ie.setu.study.modules.user.model.StudyUser;
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
@Table(name = "UserCourse")
public class UserCourse {

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
    @JoinColumn(name = "sourceusercourseid")
    private UserCourse sourceUserCourse;

    @Column(name = "addedat", nullable = false)
    private OffsetDateTime addedAt;

    @Column(name = "isarchived", nullable = false)
    private boolean archived;

    @Column(name = "displayname")
    private String displayName;

    @PrePersist
    void onCreate() {
        addedAt = OffsetDateTime.now();
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

    public UserCourse getSourceUserCourse() {
        return sourceUserCourse;
    }

    public void setSourceUserCourse(UserCourse sourceUserCourse) {
        this.sourceUserCourse = sourceUserCourse;
    }

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}
