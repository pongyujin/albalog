package com.albalog.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ReviewRequest {

    // ✅ 어떤 지원(application)에 대한 후기인지
    private Long applicationId;

    // ✅ 별점: 0.5 단위 (0.0~5.0)
    private Double rating;

    // ✅ 코멘트
    private String comment;
}
