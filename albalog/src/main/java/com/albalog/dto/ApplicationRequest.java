package com.albalog.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationRequest {

    private Long jobId;         // 지원할 공고 ID
    private Boolean useResume;  // true면 저장된 이력서 사용

    // ✅ 간단 지원 시
    private String name;        // 이름
    private String phone;       // 연락처
    private String intro;       // 한 줄 소개
    private String desc;        // 자기소개 / 경력
}
