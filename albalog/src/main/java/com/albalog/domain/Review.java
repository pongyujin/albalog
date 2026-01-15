package com.albalog.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reviews")
@Getter @Setter
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =====================================================
    // 🔗 FK: applications (후기 기준)
    // =====================================================
    @Column(name = "application_id", nullable = false, unique = true)
    private Long applicationId;

    // =====================================================
    // 🔗 FK: job_posts
    // =====================================================
    @Column(name = "job_post_id", nullable = false)
    private Long jobPostId;

    // =====================================================
    // 🔗 FK: users (작성자 = 사장님)
    // =====================================================
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // =====================================================
    // 🔗 FK: users (대상 = 알바생)
    // =====================================================
    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    // =====================================================
    // ⭐ 별점 (0.5 단위, 최대 5.0)
    // =====================================================
    @Column(name = "rating", nullable = false, precision = 2, scale = 1)
    private Double rating;

    // =====================================================
    // 📝 코멘트
    // =====================================================
    @Lob
    @Column(name = "comment", nullable = false)
    private String comment;

    // =====================================================
    // 🕒 created_at / updated_at
    // =====================================================
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
