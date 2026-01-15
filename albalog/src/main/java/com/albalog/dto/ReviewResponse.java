package com.albalog.dto;

import java.time.LocalDateTime;

import com.albalog.domain.Review;

import lombok.Getter;

@Getter
public class ReviewResponse {

    private Long id;
    private Long applicationId;
    private Long jobPostId;
    private Long ownerId;
    private Long workerId;

    private Double rating;
    private String comment;

    private LocalDateTime createdAt;

    public ReviewResponse(Review r) {
        this.id = r.getId();
        this.applicationId = r.getApplicationId();
        this.jobPostId = r.getJobPostId();
        this.ownerId = r.getOwnerId();
        this.workerId = r.getWorkerId();
        this.rating = r.getRating();
        this.comment = r.getComment();
        this.createdAt = r.getCreatedAt();
    }
}
