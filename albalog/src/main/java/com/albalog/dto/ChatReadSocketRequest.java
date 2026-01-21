package com.albalog.dto;

/**
 * ✅ 읽음 갱신 요청
 * - senderId는 절대 받지 않음 (세션에서 꺼냄)
 */
public class ChatReadSocketRequest {
    public Long roomId;
    public Long lastReadMessageId;
}
