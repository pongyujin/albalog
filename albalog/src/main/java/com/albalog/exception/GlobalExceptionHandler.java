package com.albalog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * ✅ 전역 예외 처리기
 *
 * 목표:
 * - "정책상 막는 케이스(중복 후기 등)"를
 *   서버 장애(500)가 아니라 "정상적인 거절 응답"으로 내려준다.
 *
 * 효과:
 * - ReviewService에서 던진 메시지(예: "이미 ...")가
 *   그대로 프론트로 내려가서 Swal에 노출 가능해진다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * ✅ IllegalStateException 처리
     *
     * 지금 프로젝트에서 IllegalStateException은 보통
     * - 중복 후기
     * - 상태가 ACCEPTED가 아님
     * - 본인 공고가 아님
     * 같은 "비즈니스 정책 위반"에 사용 중
     *
     * 따라서 500이 아니라 409(Conflict)나 400(Bad Request)로 내려주는 게 맞다.
     *
     * 여기서는 "중복/충돌" 성격을 가장 잘 표현하는 409로 통일.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException e) {

        // ✅ body에 메시지를 그대로 실어 보냄
        // - 프론트는 r.text로 받게 되고, 그게 Swal에 그대로 뜬다.
        return ResponseEntity
                .status(HttpStatus.CONFLICT) // 409
                .body(e.getMessage());
    }
}
