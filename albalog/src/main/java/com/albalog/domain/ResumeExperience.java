package com.albalog.domain;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "resume_experiences")
public class ResumeExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK -> resumes.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "store_name", length = 100)
    private String storeName;

    @Column(name = "industry", length = 50)
    private String industry;

    @Column(name = "period_text", length = 100)
    private String periodText;

    @Column(name = "role_text", length = 100)
    private String roleText;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // ===== getters/setters =====
    public Long getId() { return id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getPeriodText() { return periodText; }
    public void setPeriodText(String periodText) { this.periodText = periodText; }

    public String getRoleText() { return roleText; }
    public void setRoleText(String roleText) { this.roleText = roleText; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
