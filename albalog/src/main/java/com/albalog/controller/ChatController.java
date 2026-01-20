package com.albalog.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.albalog.dao.ChatMessageRepository;
import com.albalog.dao.ChatRoomRepository;
import com.albalog.domain.ChatMessage;
import com.albalog.domain.ChatRoom;
import com.albalog.dto.ChatMessageResponse;
import com.albalog.dto.ChatMessageSendRequest;
import com.albalog.dto.ChatRoomResponse;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    /**
     * ✅ 매핑 확인용 (테스트)
     * - 브라우저에서 /api/chat/ping 호출하면 "chat pong"이 떠야 함
     * - 이게 안 뜨면 컨트롤러 스캔/패키지 위치 문제
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok("chat pong");
    }

    /**
     * ✅ applicationId로 채팅방 조회
     * - 프론트가 호출하는 URL: /api/chat/rooms/by-application/{applicationId}
     * - 채용 시점에 chat_rooms가 생성되는 구조라면,
     *   채용 전 applicationId는 404가 정상임
     */
    @GetMapping("/rooms/by-application/{applicationId}")
    public ResponseEntity<?> getRoomByApplication(
            @PathVariable Long applicationId,
            HttpSession session
    ) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        ChatRoom room = chatRoomRepository.findByApplicationId(applicationId).orElse(null);

        // ✅ 방이 없으면: 아직 채용이 안 됐거나(혹은 생성 로직이 아직 안 돌아갔거나)
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("채팅방이 없습니다. (채용 후 생성)");
        }

        // ✅ 권한 체크: owner/worker만 접근 가능
        if (!userId.equals(room.getOwnerId()) && !userId.equals(room.getWorkerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("채팅방 접근 권한이 없습니다.");
        }

        // ✅ 프론트가 쓰기 쉬운 형태로 DTO처럼 최소 필드만 내려주기
        return ResponseEntity.ok(new ChatRoomResponse(room));
    }

    /**
     * ✅ 메시지 히스토리 조회 (최신 50개)
     * - 프론트가 호출하는 URL: /api/chat/rooms/{roomId}/messages?limit=50
     * - 지금은 repository가 top50 고정이라 limit은 일단 무시(추후 PageRequest로 개선 가능)
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "50") int limit,
            HttpSession session
    ) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("채팅방이 존재하지 않습니다.");
        }

        // ✅ 권한 체크
        if (!userId.equals(room.getOwnerId()) && !userId.equals(room.getWorkerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("채팅방 접근 권한이 없습니다.");
        }

        // ✅ 최신 50개를 가져오면 DESC라서 화면용으로 ASC로 다시 정렬
        List<ChatMessage> list = chatMessageRepository.findTop50ByRoomIdOrderByIdDesc(roomId);

        List<ChatMessageResponse> dtos = list.stream()
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .map(ChatMessageResponse::new)
                .toList();

        return ResponseEntity.ok(dtos);

    }
    
    /**
     * ✅ 메시지 저장(전송) - REST 버전
     * - roomId는 path로 받고
     * - content는 body로 받음
     * - 로그인 세션 기반으로 senderId 결정
     */
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long roomId,
            @RequestBody ChatMessageSendRequest req,
            HttpSession session
    ) {
        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        // ✅ 1) 입력 검증
        String content = req != null ? req.content : null;
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("메시지를 입력하세요.");
        }
        if (content.length() > 2000) {
            // ✅ text 컬럼이라 상관없지만, UX/악용 방지로 제한 권장
            return ResponseEntity.badRequest().body("메시지는 2000자 이내로 입력하세요.");
        }

        // ✅ 2) 채팅방 존재 확인
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("채팅방이 존재하지 않습니다.");
        }

        // ✅ 3) 권한 체크 (owner/worker만 전송 가능)
        if (!userId.equals(room.getOwnerId()) && !userId.equals(room.getWorkerId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("메시지 전송 권한이 없습니다.");
        }

        // ✅ 4) 저장
        ChatMessage saved = chatMessageRepository.save(new ChatMessage(
                roomId,
                userId,
                content.trim()
        ));

        // ✅ 5) 프론트가 바로 append 할 수 있도록 저장된 메시지 DTO 반환
        return ResponseEntity.ok(new ChatMessageResponse(saved));
    }
}
