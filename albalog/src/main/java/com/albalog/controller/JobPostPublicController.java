package com.albalog.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.albalog.dto.JobPostListResponse;
import com.albalog.service.JobPostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class JobPostPublicController {

    private final JobPostService jobPostService;

    // 홈(전체 공고) 조회
    // 예: /api/job-posts
    // 예: /api/job-posts?regionCity=광주&regionDistrict=동구
    @GetMapping("/job-posts")
    public List<JobPostListResponse> list(
            @RequestParam(required = false) String regionCity,
            @RequestParam(required = false) String regionDistrict
    ) {
        return jobPostService.getPublicJobPosts(regionCity, regionDistrict)
                .stream()
                .map(JobPostListResponse::new)
                .toList();
    }
}
