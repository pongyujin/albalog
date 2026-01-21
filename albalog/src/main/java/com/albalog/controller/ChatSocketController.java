package com.albalog.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.albalog.domain.ChatMessage;
import com.albalog.domain.ChatRoomRead;
import com.albalog.dto.ChatMessageResponse;
import com.albalog.dto.ChatMessageSocketRequest;
import com.albalog.dto.ChatReadSocketRequest;
import com.albalog.dto.ChatReadSocketResponse;
import com.albalog.service.ChatMessageService;
import com.albalog.service.ChatReadService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;
    private final ChatReadService chatReadService;

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
    
    
    /**
     * ✅ 읽음 갱신 수신
     * 클라이언트 → /app/chat.read
     */
    @MessageMapping("/chat.read")
    public void read(ChatReadSocketRequest req, SimpMessageHeaderAccessor headers) {

        // ✅ 1) 세션에서 로그인 userId 가져오기
        Object v = headers.getSessionAttributes() != null
                ? headers.getSessionAttributes().get("LOGIN_USER_ID")
                : null;

        Long userId = (v instanceof Long) ? (Long) v : null;
        if (userId == null) return;

        // ✅ 2) DB 읽음 갱신
        ChatRoomRead updated = chatReadService.updateRead(req.roomId, userId, req.lastReadMessageId);

        // ✅ 3) 같은 방 구독자들에게 읽음 이벤트 브로드캐스트
        // - 메시지 topic과 분리해서 읽음만 따로 받게 함
        messagingTemplate.convertAndSend(
                "/topic/chat.read." + req.roomId,
                new ChatReadSocketResponse(updated)
        );
    }
}
