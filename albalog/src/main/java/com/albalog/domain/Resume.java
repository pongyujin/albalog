package com.albalog.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resumes")
public class Resume {

    // =====================================================
    // 🔗 User (1:1 관계)
    // =====================================================
	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", insertable = false, updatable = false)
	private User user;



    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // =====================================================
    // 🔑 기본 필드
    // =====================================================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "desired_wage")
    private Integer desiredWage;

    @Column(name = "wage_negotiable", nullable = false)
    private boolean wageNegotiable;

    @Column(name = "working_days", length = 100)
    private String workingDays;

    @Column(name = "days_negotiable", nullable = false)
    private boolean daysNegotiable;

    @Column(name = "time_start")
    private LocalTime timeStart;

    @Column(name = "time_end")
    private LocalTime timeEnd;

    @Column(name = "time_negotiable", nullable = false)
    private boolean timeNegotiable;

    @Lob
    @Column(name = "introduction")
    private String introduction;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // =====================================================
    // 📋 경력 (1:N)
    // =====================================================
    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeExperience> experiences = new ArrayList<>();

    // =====================================================
    // 🧩 스킬 (1:N)
    // =====================================================
    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeSkill> skills = new ArrayList<>();

    // =====================================================
    // 🧾 Getters / Setters
    // =====================================================
    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getDesiredWage() {
        return desiredWage;
    }

    public void setDesiredWage(Integer desiredWage) {
        this.desiredWage = desiredWage;
    }

    public boolean isWageNegotiable() {
        return wageNegotiable;
    }

    public void setWageNegotiable(boolean wageNegotiable) {
        this.wageNegotiable = wageNegotiable;
    }

    public String getWorkingDays() {
        return workingDays;
    }

    public void setWorkingDays(String workingDays) {
        this.workingDays = workingDays;
    }

    public boolean isDaysNegotiable() {
        return daysNegotiable;
    }

    public void setDaysNegotiable(boolean daysNegotiable) {
        this.daysNegotiable = daysNegotiable;
    }

    public LocalTime getTimeStart() {
        return timeStart;
    }

    public void setTimeStart(LocalTime timeStart) {
        this.timeStart = timeStart;
    }

    public LocalTime getTimeEnd() {
        return timeEnd;
    }

    public void setTimeEnd(LocalTime timeEnd) {
        this.timeEnd = timeEnd;
    }

    public boolean isTimeNegotiable() {
        return timeNegotiable;
    }

    public void setTimeNegotiable(boolean timeNegotiable) {
        this.timeNegotiable = timeNegotiable;
    }

    public String getIntroduction() {
        return introduction;
    }

    public void setIntroduction(String introduction) {
        this.introduction = introduction;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<ResumeExperience> getExperiences() {
        return experiences;
    }

    public void setExperiences(List<ResumeExperience> experiences) {
        this.experiences = experiences;
    }

    public List<ResumeSkill> getSkills() {
        return skills;
    }

    public void setSkills(List<ResumeSkill> skills) {
        this.skills = skills;
    }
}
