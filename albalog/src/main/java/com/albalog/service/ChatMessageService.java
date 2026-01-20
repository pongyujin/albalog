package com.albalog.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ChatMessageRepository;
import com.albalog.dao.ChatRoomRepository;
import com.albalog.domain.ChatMessage;
import com.albalog.domain.ChatRoom;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;

    /**
     * ✅ 메시지 저장
     * - roomId 존재 여부 확인
     * - sender가 room 참여자인지 확인(보안!)
     * - content 검증
     */
    @Transactional
    public ChatMessage save(Long roomId, Long senderId, String content) {

        // -----------------------------
        // 1) 입력 검증
        // -----------------------------
        if (roomId == null) {
            throw new IllegalArgumentException("roomId가 없습니다.");
        }
        if (senderId == null) {
            throw new IllegalArgumentException("senderId가 없습니다.");
        }

        String msg = content != null ? content.trim() : "";
        if (msg.isEmpty()) {
            throw new IllegalArgumentException("메시지를 입력하세요.");
        }
        if (msg.length() > 2000) {
            throw new IllegalArgumentException("메시지는 2000자 이내로 입력하세요.");
        }

        // -----------------------------
        // 2) 채팅방 존재 확인
        // -----------------------------
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        // -----------------------------
        // 3) 권한 확인 (owner/worker만 전송 가능)
        // -----------------------------
        boolean isMember =
                senderId.equals(room.getOwnerId()) ||
                senderId.equals(room.getWorkerId());

        if (!isMember) {
            throw new IllegalStateException("채팅방 참여자만 메시지를 보낼 수 있습니다.");
        }

        // -----------------------------
        // 4) 저장
        // - createdAt 컬럼이 엔티티에서 자동 세팅이 아니라면 여기서 세팅
        // - 너 ChatMessage 엔티티 구조에 따라 createdAt이 없을 수도 있으니
        //   생성자/필드에 맞춰 조정하면 됨
        // -----------------------------
        ChatMessage entity = new ChatMessage(roomId, senderId, msg);

        // ✅ createdAt을 엔티티에서 자동으로 안 넣고 있다면 아래 줄을 사용
        // entity.setCreatedAt(LocalDateTime.now());

        return chatMessageRepository.save(entity);
    }
}
