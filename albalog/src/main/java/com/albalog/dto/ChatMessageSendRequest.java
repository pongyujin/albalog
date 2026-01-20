package com.albalog.dto;

/**
 * ✅ 메시지 전송 요청 DTO
 * - content만 받으면 충분 (roomId는 path로 받음)
 */
public class ChatMessageSendRequest {
    public String content;
}
