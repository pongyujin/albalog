package com.albalog.domain;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(
    name = "resume_skills",
    uniqueConstraints = @UniqueConstraint(name = "uq_resume_skill", columnNames = {"resume_id", "skill_code"})
)
public class ResumeSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK -> resumes.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "skill_code", nullable = false, length = 30)
    private String skillCode;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public String getDisplayName() {
        return skillCode; // 나중에 코드→이름 매핑 테이블 추가해도 여기에 처리 가능
    }


    // ===== getters/setters =====
    public Long getId() { return id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }
}
