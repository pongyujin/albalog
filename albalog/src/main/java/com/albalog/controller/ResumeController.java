package com.albalog.controller;

import java.util.Optional;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.albalog.dto.ResumeResponse;
import com.albalog.dto.ResumeSaveRequest;
import com.albalog.service.ResumeService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    // 내 이력서 조회
    @GetMapping("/me")
    public ResponseEntity<?> getMyResume(HttpSession session) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<ResumeResponse> resp = resumeService.getMyResume(userId);
        if (resp.isEmpty()) return ResponseEntity.noContent().build(); // 이력서 아직 없음

        return ResponseEntity.ok(resp.get());
    }

    // 내 이력서 저장(생성/수정)
    @PutMapping("/me")
    public ResponseEntity<?> saveMyResume(@RequestBody ResumeSaveRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        resumeService.saveOrUpdate(userId, req);
        return ResponseEntity.ok().build();
    }
}
