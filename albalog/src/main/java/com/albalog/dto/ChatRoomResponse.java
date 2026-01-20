package com.albalog.dto;

import com.albalog.domain.ChatRoom;

/**
 * ✅ 채팅방 응답 DTO
 * - 프론트에서 필요한 최소 필드만 내려줌
 */
public class ChatRoomResponse {

    public Long roomId;
    public Long applicationId;
    public Long ownerId;
    public Long workerId;
    public Long jobPostId;

    public ChatRoomResponse(ChatRoom room) {
        this.roomId = room.getId();
        this.applicationId = room.getApplicationId();
        this.ownerId = room.getOwnerId();
        this.workerId = room.getWorkerId();
        this.jobPostId = room.getJobPostId();
    }
}
