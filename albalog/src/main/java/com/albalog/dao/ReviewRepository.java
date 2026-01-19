package com.albalog.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.albalog.domain.Review;
import com.albalog.domain.ReviewPhase;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * ✅ (지원건, 단계)당 후기 1개
     * - DB 유니크: (application_id, phase)
     */
    Optional<Review> findByApplicationIdAndPhase(Long applicationId, ReviewPhase phase);

    /**
     * ✅ 알바생(worker) 기준 후기 목록
     */
    List<Review> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    /**
     * ✅ 공고 기준 후기 목록
     */
    List<Review> findByJobPostIdOrderByCreatedAtDesc(Long jobPostId);

    /**
     * ✅ 사장님이 특정 알바생에게 쓴 후기들
     */
    List<Review> findByOwnerIdAndWorkerIdOrderByCreatedAtDesc(Long ownerId, Long workerId);
}
