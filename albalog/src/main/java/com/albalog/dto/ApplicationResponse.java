package com.albalog.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.albalog.domain.Application;
import com.albalog.domain.JobPost;
import com.albalog.domain.Resume;
import com.albalog.domain.ResumeSkill;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApplicationResponse {

    private Long id;

    // 지원자 정보
    private String applicantName;
    private String applicantPhone;
    private Integer applicantAge;

    // 공고 정보
    private String jobTitle;
    private String storeName;
    private Integer wage;
    private String wageType;
    private String regionCity;
    private String regionDistrict;

    // 지원 관련
    private String intro;
    private String description;
    private LocalDateTime createdAt; // 지원 시각
    private LocalDateTime readAt;    // 사장님이 열람한 시각
    private String status; // ✅ 추가!

    // 이력서 요약
    private List<String> skills;
    private List<String> experiences;

    // ✅ 기본 생성자 (직접 필드 세팅용)
    public ApplicationResponse(Long id, String applicantName, String applicantPhone,
                               String intro, String description, LocalDateTime createdAt) {
        this.id = id;
        this.applicantName = applicantName;
        this.applicantPhone = applicantPhone;
        this.intro = intro;
        this.description = description;
        this.createdAt = createdAt;
    }

    // ✅ Application → DTO 변환용 생성자
    public ApplicationResponse(Application a) {
        this.id = a.getId();
        this.applicantName = a.getUser().getName();
        this.applicantPhone = a.getUser().getPhone();
        this.applicantAge = a.getUser().getAge();
        this.intro = a.getIntro();
        this.description = a.getDescription();
        this.createdAt = a.getCreatedAt();
        this.readAt = a.getViewedAt(); // 사장님이 열람한 시간 기록
        this.status = a.getStatus().name(); // ✅ 상태 문자열로 변환

        // ✅ JobPost 정보 추가 (공고 정보)
        JobPost job = a.getJobPost();
        if (job != null) {
            this.jobTitle = job.getTitle();
            this.storeName = job.getStoreName();
            this.wage = job.getWage();
            this.wageType = job.getWageType() != null ? job.getWageType().name() : null;
            this.regionCity = job.getRegionCity();
            this.regionDistrict = job.getRegionDistrict();
        }

        // ✅ 연결된 이력서 요약
        Resume resume = a.getResume();
        if (resume != null) {
            this.skills = resume.getSkills().stream()
                .map(ResumeSkill::getSkillCode)
                .collect(Collectors.toList());

            this.experiences = resume.getExperiences().stream()
                .map(e -> e.getStoreName() + " (" + e.getRoleText() + ")")
                .collect(Collectors.toList());
        }
    }
}
