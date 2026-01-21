package com.albalog.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ChatRoomReadRepository;
import com.albalog.dao.ChatRoomRepository;
import com.albalog.domain.ChatRoom;
import com.albalog.domain.ChatRoomRead;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatReadService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomReadRepository chatRoomReadRepository;

    /**
     * ✅ 읽음 갱신
     * - room 참여자만 가능
     * - lastReadMessageId는 "항상 증가"만 허용 (뒤로 가면 무시)
     */
    @Transactional
    public ChatRoomRead updateRead(Long roomId, Long userId, Long lastReadMessageId) {

        // -----------------------------
        // 1) 입력 검증
        // -----------------------------
        if (roomId == null) throw new IllegalArgumentException("roomId가 없습니다.");
        if (userId == null) throw new IllegalArgumentException("userId가 없습니다.");
        if (lastReadMessageId == null) throw new IllegalArgumentException("lastReadMessageId가 없습니다.");

        // -----------------------------
        // 2) 채팅방 조회 + 참여자 검증
        // -----------------------------
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        boolean isMember = userId.equals(room.getOwnerId()) || userId.equals(room.getWorkerId());
        if (!isMember) {
            throw new IllegalStateException("채팅방 참여자만 읽음 갱신이 가능합니다.");
        }

        // -----------------------------
        // 3) 읽음 row 조회
        // -----------------------------
        ChatRoomRead read = chatRoomReadRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalStateException("읽음 정보 row가 없습니다."));

        // -----------------------------
        // 4) lastReadMessageId는 증가만 허용
        // -----------------------------
        Long prev = read.getLastReadMessageId();
        if (prev != null && lastReadMessageId <= prev) {
            // ✅ 이미 더 최신까지 읽은 상태면 업데이트 불필요
            return read;
        }

        // -----------------------------
        // 5) ✅ 엔티티 메서드로 갱신 (setter 대신 markAsRead 사용)
        // -----------------------------
        read.markAsRead(lastReadMessageId);

        // save 호출 안 해도 되긴 함(영속 상태면 dirty checking)
        // 그래도 명시적으로 save하면 더 직관적이라 남겨둠
        return chatRoomReadRepository.save(read);
    }
}
