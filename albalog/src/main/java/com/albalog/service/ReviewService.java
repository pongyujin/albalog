package com.albalog.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ApplicationRepository;
import com.albalog.dao.JobPostRepository;
import com.albalog.dao.ReviewRepository;
import com.albalog.domain.Application;
import com.albalog.domain.Review;
import com.albalog.dto.ReviewRequest;
import com.albalog.dto.ReviewResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ApplicationRepository applicationRepository;
    private final JobPostRepository jobPostRepository;

    // ✅ 사장님이 후기 작성
    @Transactional
    public ReviewResponse createReview(Long ownerId, ReviewRequest req) {

        // 1) application 확인
        Application app = applicationRepository.findById(req.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("지원서를 찾을 수 없습니다."));

        // 2) 채용된 지원인지 확인
        if (app.getStatus() != Application.Status.ACCEPTED) {
            throw new IllegalStateException("채용된 지원자만 후기를 남길 수 있습니다.");
        }

        // 3) 이 공고의 사장님이 맞는지 확인
        Long jobPostId = app.getJobPost().getId();
        var post = jobPostRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다."));

        if (!post.getOwnerId().equals(ownerId)) {
            throw new IllegalStateException("본인 공고의 지원자에게만 후기를 남길 수 있습니다.");
        }

        // 4) 이미 후기 작성했는지 확인(지원건당 1개)
        if (reviewRepository.findByApplicationId(app.getId()).isPresent()) {
            throw new IllegalStateException("이미 이 지원건에 대한 후기가 존재합니다.");
        }

        // 5) 별점 검증 (0.0~5.0, 0.5 단위)
        Double rating = req.getRating();
        if (rating == null || rating < 0.0 || rating > 5.0 || (rating * 2) % 1 != 0) {
            throw new IllegalArgumentException("별점은 0.0~5.0 사이, 0.5 단위만 가능합니다.");
        }

        // 6) 저장
        Review r = new Review();
        r.setApplicationId(app.getId());
        r.setJobPostId(jobPostId);
        r.setOwnerId(ownerId);
        r.setWorkerId(app.getUser().getId()); // 지원한 알바생 id
        r.setRating(rating);
        r.setComment(req.getComment() == null ? "" : req.getComment().trim());

        if (r.getComment().isEmpty()) {
            throw new IllegalArgumentException("후기 코멘트를 입력해주세요.");
        }

        Review saved = reviewRepository.save(r);
        return new ReviewResponse(saved);
    }

    // ✅ 알바생(또는 누구든) worker 기준 후기 조회
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByWorker(Long workerId) {
        return reviewRepository.findByWorkerIdOrderByCreatedAtDesc(workerId)
                .stream().map(ReviewResponse::new).toList();
    }

    // ✅ 공고 기준 후기 조회
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByJobPost(Long jobPostId) {
        return reviewRepository.findByJobPostIdOrderByCreatedAtDesc(jobPostId)
                .stream().map(ReviewResponse::new).toList();
    }
}
