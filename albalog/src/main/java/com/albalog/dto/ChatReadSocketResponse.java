package com.albalog.dto;

import com.albalog.domain.ChatRoomRead;

/**
 * ✅ 읽음 갱신 결과 브로드캐스트용
 */
public class ChatReadSocketResponse {
    public Long roomId;
    public Long userId;              // ✅ 누가 읽었는지
    public Long lastReadMessageId;   // ✅ 어디까지 읽었는지
    public String lastReadAt;

    public ChatReadSocketResponse(ChatRoomRead r) {
        this.roomId = r.getRoomId();
        this.userId = r.getUserId();
        this.lastReadMessageId = r.getLastReadMessageId();
        this.lastReadAt = r.getLastReadAt() != null ? r.getLastReadAt().toString() : null;
    }
}
