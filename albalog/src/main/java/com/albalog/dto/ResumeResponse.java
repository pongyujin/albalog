package com.albalog.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.albalog.domain.Resume;
import com.albalog.domain.ResumeSkill;

public class ResumeResponse {

    // ✅ 유저 기본정보
    public String name;
    public Integer age;
    public String phone;

    // ✅ 이력서 기본정보
    public Integer desiredWage;
    public boolean wageNegotiable;
    public List<String> days = new ArrayList<>();
    public boolean daysNegotiable;
    public String timeStart;
    public String timeEnd;
    public boolean timeNegotiable;
    public String introduction;
    private String workingDays;

    // ✅ 경력 & 스킬
    public List<Experience> experiences = new ArrayList<>();
    public List<String> skills = new ArrayList<>();

    // ✅ 내부 클래스
    public static class Experience {
        public String storeName;
        public String industry;
        public String periodText;
        public String roleText;
    }

    // ✅ 생성자
    public ResumeResponse(Resume resume) {
        // --- 유저 정보 포함 ---
        if (resume.getUser() != null) {
            this.name = resume.getUser().getName();
            this.age = resume.getUser().getAge();
            this.phone = resume.getUser().getPhone();
        }

     // --- 이력서 기본정보 ---
        this.desiredWage = resume.getDesiredWage();
        this.wageNegotiable = resume.isWageNegotiable();
        this.daysNegotiable = resume.isDaysNegotiable();
        this.timeNegotiable = resume.isTimeNegotiable();
        this.introduction = resume.getIntroduction();
        this.workingDays = resume.getWorkingDays();
        this.timeStart = (resume.getTimeStart() != null) ? resume.getTimeStart().toString() : null;
        this.timeEnd = (resume.getTimeEnd() != null) ? resume.getTimeEnd().toString() : null;

        // ✅ [핵심 추가] workingDays(String) → days(List<String>)
        if (this.workingDays != null && !this.workingDays.isBlank()) {
            // 예: "MON,TUE,WED,THU"
            this.days = List.of(this.workingDays.split(","));
        }

        // --- 스킬 목록 ---
        if (resume.getSkills() != null) {
            this.skills = resume.getSkills().stream()
                    .map(ResumeSkill::getSkillCode)
                    .collect(Collectors.toList());
        }

        // --- 경력 목록 ---
        if (resume.getExperiences() != null) {
            this.experiences = resume.getExperiences().stream().map(e -> {
                Experience x = new Experience();
                x.storeName = e.getStoreName();
                x.industry = e.getIndustry();
                x.periodText = e.getPeriodText();
                x.roleText = e.getRoleText();
                return x;
            }).collect(Collectors.toList());
        }
    }
}
