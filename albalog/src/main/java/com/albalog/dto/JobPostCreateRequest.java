package com.albalog.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter 
@Setter
public class JobPostCreateRequest {

    private String storeName;       // 가게이름
    private String title;           // 공고제목

    private Integer wage;           // 시급(숫자)
    private String wageType;        // "HOURLY" or "NEGOTIABLE"

    private java.util.List<String> days;     // ✅ 배열로 받기
    private Boolean daysNegotiable;          // ✅ 협의 여부도 받기

    private String timeStart;       // "10:00" (협의면 null/빈값)
    private String timeEnd;         // "18:00"
    private Boolean timeNegotiable; // true면 시간 무시 가능

    private String regionCity;      // 시/도
    private String regionDistrict;  // 구/군
    private String addressDetail;   // 상세주소

    private String description;     // 설명
    private String imageUrl;        // 이미지 URL (일단은 URL만)
}
