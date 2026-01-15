package com.albalog.controller;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.albalog.dto.JobPostListResponse;
import com.albalog.service.JobPostService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/jobs")
public class JobPostController {

    private final JobPostService jobPostService;

    // ✅ 사장님 전용: 내 공고 목록 조회
    @GetMapping("/mine")
    public List<JobPostListResponse> getMyJobs(HttpSession session) {
        Long ownerId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (ownerId == null) throw new RuntimeException("로그인 필요");

        return jobPostService.findByOwnerId(ownerId)
                .stream()
                .map(JobPostListResponse::new)
                .toList();
    }
}
