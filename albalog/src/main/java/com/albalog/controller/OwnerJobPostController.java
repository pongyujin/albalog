package com.albalog.controller;

import com.albalog.dto.JobPostCreateRequest;
import com.albalog.service.JobPostService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/owner/job-posts")
public class OwnerJobPostController {
	
	// 공고 올리는 컨트롤러!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
	
    // ✅ 스프링이 주입해줌 (new 절대 금지)
    private final JobPostService jobPostService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody JobPostCreateRequest req, HttpSession session) {

        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        Boolean isOwner = (Boolean) session.getAttribute("LOGIN_IS_OWNER");

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));
        }
        if (isOwner == null || !isOwner) {
            return ResponseEntity.status(403).body(Map.of("message", "사장님만 공고를 올릴 수 있습니다."));
        }

        Long postId = jobPostService.createJobPost(userId, req);
        return ResponseEntity.ok(Map.of("id", postId));
    }
}
