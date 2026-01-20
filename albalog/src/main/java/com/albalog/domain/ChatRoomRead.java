package com.albalog.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(
    name = "chat_room_reads",
    uniqueConstraints = {
        // ✅ 한 방(room)에서 한 유저(user)의 읽음 상태는 1개만 존재해야 함
        @UniqueConstraint(name = "uq_chat_room_reads_room_user", columnNames = {"room_id", "user_id"})
    }
)
public class ChatRoomRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 채팅방 ID
    @Column(name = "room_id", nullable = false)
    private Long roomId;

    // ✅ 유저 ID (owner or worker)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // ✅ 마지막으로 읽은 메시지 ID
    // - 처음엔 null일 수 있어서 nullable
    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    // ✅ 마지막으로 읽은 시각
    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    // ✅ 갱신 시각
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ✅ 정적 팩토리 메서드: room 생성할 때 owner/worker read row 만들기 편함
    public static ChatRoomRead forUser(Long roomId, Long userId) {
        ChatRoomRead r = new ChatRoomRead();
        r.roomId = roomId;
        r.userId = userId;
        // lastReadMessageId / lastReadAt은 null로 시작 (아직 아무 메시지도 안 읽었으니까)
        return r;
    }

    // ✅ 읽음 업데이트용 메서드(서비스에서 호출)
    public void markAsRead(Long messageId) {
        this.lastReadMessageId = messageId;
        this.lastReadAt = LocalDateTime.now();
    }

    @PrePersist
    private void onCreate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
