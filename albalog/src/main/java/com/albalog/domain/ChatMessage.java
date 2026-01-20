package com.albalog.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 어떤 채팅방의 메시지인지
    @Column(name = "room_id", nullable = false)
    private Long roomId;

    // ✅ 보낸 사람(user_id)
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    // ✅ 메시지 본문
    // - DDL에서 text라서 JPA에서도 @Lob 쓰는 게 자연스러움
    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    // ✅ 메시지 생성 시간
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ChatMessage(Long roomId, Long senderId, String content) {
        this.roomId = roomId;
        this.senderId = senderId;
        this.content = content;
    }

    @PrePersist
    private void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
