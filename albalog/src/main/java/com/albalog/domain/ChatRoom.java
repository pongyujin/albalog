package com.albalog.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // ✅ JPA 기본 생성자 필수
@Entity
@Table(
    name = "chat_rooms",
    uniqueConstraints = {
        // ✅ application_id는 지원서 1개당 채팅방 1개여야 해서 UNIQUE
        @UniqueConstraint(name = "uq_chat_rooms_application", columnNames = "application_id")
    }
)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ✅ MySQL auto_increment 대응
    private Long id;

    // ✅ "방 키" 역할
    // - application 하나당 1:1 채팅방 하나
    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    // ✅ 채팅 목록에서 공고/가게명 표시용으로 넣어두면 편함
    @Column(name = "job_post_id", nullable = false)
    private Long jobPostId;

    // ✅ 사장님 user_id
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // ✅ 알바생(지원자) user_id
    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    // ✅ 생성/갱신 시간
    // - DDL에서 DEFAULT CURRENT_TIMESTAMP 를 썼지만,
    //   JPA에서도 값이 필요하면 직접 세팅해서 저장하는 방식이 안정적임
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ✅ 편의 생성자(서비스에서 방 만들 때 사용)
    public ChatRoom(Long applicationId, Long jobPostId, Long ownerId, Long workerId) {
        this.applicationId = applicationId;
        this.jobPostId = jobPostId;
        this.ownerId = ownerId;
        this.workerId = workerId;
    }

    // ✅ 저장 직전에 createdAt/updatedAt 자동 세팅
    @PrePersist
    private void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    // ✅ 업데이트 직전에 updatedAt 자동 세팅
    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
