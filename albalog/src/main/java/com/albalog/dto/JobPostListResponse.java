package com.albalog.dto;

import com.albalog.domain.JobPost;

import lombok.Getter;

@Getter
public class JobPostListResponse {

    private Long id;
    private String storeName;
    private String title;

    private Integer wage;
    private String wageType;

    private Boolean timeNegotiable;
    private String timeStart;
    private String timeEnd;

    private String regionCity;
    private String regionDistrict;
    
    private String description;

    public JobPostListResponse(JobPost p) {
        this.id = p.getId();
        this.storeName = p.getStoreName();
        this.title = p.getTitle();
        this.wage = p.getWage();
        this.wageType = String.valueOf(p.getWageType());
        this.timeNegotiable = p.getTimeNegotiable();
        this.timeStart = p.getTimeStart() == null ? null : p.getTimeStart().toString();
        this.timeEnd = p.getTimeEnd() == null ? null : p.getTimeEnd().toString();
        this.regionCity = p.getRegionCity();
        this.regionDistrict = p.getRegionDistrict();
        
        this.description = p.getDescription();
    }
}
