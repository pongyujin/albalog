package com.albalog.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.albalog.domain.ChatMessage;
import com.albalog.dto.ChatMessageResponse;
import com.albalog.dto.ChatMessageSocketRequest;
import com.albalog.service.ChatMessageService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;

    /**
     * ✅ 실시간 메시지 수신
     * - 클라이언트 → /app/chat.send
     * - 서버에서 세션 로그인 유저를 sender로 사용 (조작 방지)
     */
    @MessageMapping("/chat.send")
    public void send(ChatMessageSocketRequest req,  SimpMessageHeaderAccessor headers
) {

        // ✅ 1) WebSocket 세션에서 로그인 유저 ID 꺼내기
        // - HttpSession의 "LOGIN_USER_ID"가 그대로 들어와야 함
        Object v = headers.getSessionAttributes() != null
                ? headers.getSessionAttributes().get("LOGIN_USER_ID")
                : null;

        Long senderId = (v instanceof Long) ? (Long) v : null;
        if (senderId == null) {
            // 로그인 안 된 소켓 연결이면 무시 (또는 예외 처리)
            return;
        }

        // ✅ 2) DB 저장
        ChatMessage saved = chatMessageService.save(
                req.roomId,
                senderId,
                req.content
        );

        // ✅ 3) 브로드캐스트
        messagingTemplate.convertAndSend(
                "/topic/chat.room." + req.roomId,
                new ChatMessageResponse(saved)
        );
    }
}
