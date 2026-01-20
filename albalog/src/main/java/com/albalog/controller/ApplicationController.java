package com.albalog.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.albalog.dao.ApplicationRepository;
import com.albalog.domain.Application;
import com.albalog.domain.Application.Status;
import com.albalog.domain.Resume;
import com.albalog.dto.ApplicationRequest;
import com.albalog.dto.ApplicationResponse;
import com.albalog.dto.ResumeResponse;
import com.albalog.service.ApplicationService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository; // ✅ 추가

    // ✅ 지원하기 (POST)
    @PostMapping
    public ResponseEntity<?> apply(HttpSession session, @RequestBody ApplicationRequest request) {

        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        applicationService.apply(userId, request);
        return ResponseEntity.ok("지원 완료!");
    }



    // ✅ 사장님 - 특정 공고의 지원자 목록 보기
    @GetMapping("/by-job/{jobId}")
    public ResponseEntity<?> getApplicationsByJob(@PathVariable Long jobId, HttpSession session) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        Boolean isOwner = (Boolean) session.getAttribute("LOGIN_IS_OWNER");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        if (Boolean.FALSE.equals(isOwner)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("사장님만 접근 가능합니다.");
        }

        List<ApplicationResponse> list = applicationService.getApplicantsByJob(jobId, userId);
        return ResponseEntity.ok(list);
    }

 // 지원자 이력서 보기 
    @GetMapping("/{id}/resume")
    public ResponseEntity<ResumeResponse> getApplicantResume(@PathVariable Long id) {
        System.out.println("😀 /api/applications/{id}/resume 들어");

        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("지원서를 찾을 수 없습니다."));

        // ✅ 이력서 존재 확인
        Resume resume = app.getResume();
        if (resume == null) {
            System.out.println("ApplicationController resume null" + resume);
            return ResponseEntity.notFound().build();
        }
        // ✅ 처음 열람일 때만 열람 시각 기록
        if (app.getViewedAt() == null) {
            app.setViewedAt(LocalDateTime.now());
            applicationRepository.save(app);
            System.out.println("👀 열람 시각 기록 완료: " + app.getViewedAt());
        } else {
            System.out.println("📎 이미 열람한 지원서입니다. 기록 유지: " + app.getViewedAt());
        }

        // ✅ Lazy 로딩 초기화
        resume.getExperiences().size();
        resume.getSkills().size();

        ResumeResponse dto = new ResumeResponse(resume);
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam Status status,
            HttpSession session
    ) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        Boolean isOwner = (Boolean) session.getAttribute("LOGIN_IS_OWNER");

        // ✅ 로그인 체크
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        // ✅ 사장님만 상태 변경 가능하도록 제한 (채용/거절은 사장님 권한)
        if (Boolean.FALSE.equals(isOwner)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("사장님만 상태 변경이 가능합니다.");
        }

        // ✅ 진짜 로직은 서비스로!
        applicationService.updateStatusByOwner(id, status, userId);

        return ResponseEntity.ok().build();
    }

    
    // 
    // ✅ 알바생 - 내 지원 내역 보기
    @GetMapping("/my")
    public ResponseEntity<?> getMyApplications(HttpSession session) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        List<ApplicationResponse> apps = applicationService.getMyApplications(userId);
        return ResponseEntity.ok(apps);
    }

}
