package com.albalog.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.albalog.dto.ReviewRequest;
import com.albalog.dto.ReviewResponse;
import com.albalog.service.ReviewService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // ✅ 후기 작성 (사장님만)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ReviewRequest req, HttpSession session) {

        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        Boolean isOwner = (Boolean) session.getAttribute("LOGIN_IS_OWNER");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        if (Boolean.FALSE.equals(isOwner)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("사장님만 후기를 작성할 수 있습니다.");
        }

        ReviewResponse saved = reviewService.createReview(userId, req);
        return ResponseEntity.ok(saved);
    }

    // ✅ 알바생(worker) 기준 후기 조회
    @GetMapping("/by-worker/{workerId}")
    public ResponseEntity<List<ReviewResponse>> byWorker(@PathVariable Long workerId) {
        return ResponseEntity.ok(reviewService.getReviewsByWorker(workerId));
    }

    // ✅ 공고 기준 후기 조회
    @GetMapping("/by-job/{jobPostId}")
    public ResponseEntity<List<ReviewResponse>> byJob(@PathVariable Long jobPostId) {
        return ResponseEntity.ok(reviewService.getReviewsByJobPost(jobPostId));
    }
}
