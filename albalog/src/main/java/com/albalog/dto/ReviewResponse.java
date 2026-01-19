package com.albalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.albalog.domain.Review;
import com.albalog.domain.ReviewPhase;

import lombok.Getter;

/**
 * ✅ ReviewResponse
 * - 프론트에 내려줄 후기 응답 DTO
 * - 버튼 상태 판단을 위해 phase(INITIAL/MONTH_1/MONTH_3)를 반드시 포함해야 함
 */
@Getter
public class ReviewResponse {

    private Long id;

    private Long applicationId;

    // ✅ (추가) 후기 단계
    // - 프론트에서 "이미 INITIAL 작성했는지" 판단할 때 필요
    private ReviewPhase phase;

    private Long jobPostId;
    private Long ownerId;
    private Long workerId;
    
    // ✅ 추가
    private String storeName;

    private BigDecimal rating;
    private String comment;

    private LocalDateTime createdAt;

    public ReviewResponse(Review r) {
        this.id = r.getId();
        this.applicationId = r.getApplicationId();

        // ✅ (추가) phase를 응답에 포함
        // - 현재 INITIAL만 쓰더라도 구조상 내려주는 게 맞음
        this.phase = r.getPhase();

        this.jobPostId = r.getJobPostId();
        this.ownerId = r.getOwnerId();
        this.workerId = r.getWorkerId();
   
        
        this.rating = r.getRating();
        this.comment = r.getComment();
        this.createdAt = r.getCreatedAt();
    }
    public ReviewResponse(Review r, String storeName) {
        this.id = r.getId();
        this.applicationId = r.getApplicationId();
        this.phase = r.getPhase();
        this.jobPostId = r.getJobPostId();
        this.ownerId = r.getOwnerId();
        this.workerId = r.getWorkerId();
        this.rating = r.getRating();
        this.comment = r.getComment();
        this.createdAt = r.getCreatedAt();
        this.storeName = storeName;
    }
}
