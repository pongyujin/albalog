package com.albalog.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = {
        // ✅ DB와 동일하게: (application_id, phase) 유니크
        @UniqueConstraint(name = "uq_reviews_application_phase", columnNames = {"application_id", "phase"})
    }
)
@Getter
@Setter
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =====================================================
    // 🔗 FK: applications (후기 기준)
    // ✅ 더 이상 application_id 단독 unique 아님
    // =====================================================
    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    // =====================================================
    // ✅ 후기 단계
    // - INITIAL : 채용 직후(기본)
    // - MONTH_1 : 근무 1개월 후기
    // - MONTH_3 : 근무 3개월 후기
    // =====================================================
    @Enumerated(EnumType.STRING)
    @Column(name = "phase", nullable = false)
    private ReviewPhase phase = ReviewPhase.INITIAL;

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
    @Column(name = "rating", precision = 2, scale = 1, nullable = false)
    private BigDecimal rating;

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
