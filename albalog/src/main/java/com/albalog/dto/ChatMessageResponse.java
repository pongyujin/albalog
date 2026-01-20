package com.albalog.dto;

import com.albalog.domain.ChatMessage;

/**
 * ✅ 채팅 메시지 응답 DTO
 */
public class ChatMessageResponse {

    public Long id;
    public Long roomId;
    public Long senderId;
    public String content;
    public String createdAt;

    public ChatMessageResponse(ChatMessage msg) {
        this.id = msg.getId();
        this.roomId = msg.getRoomId();
        this.senderId = msg.getSenderId();
        this.content = msg.getContent();
        this.createdAt = msg.getCreatedAt() != null
                ? msg.getCreatedAt().toString()
                : null;
    }
}
