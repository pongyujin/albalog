package com.albalog.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.albalog.domain.ChatRoom;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // ✅ applicationId로 채팅방 조회 (핵심!)
    Optional<ChatRoom> findByApplicationId(Long applicationId);

    // ✅ 사장님 채팅방 목록 같은 거 만들 때 유용
    // List<ChatRoom> findByOwnerId(Long ownerId);

    // ✅ 알바생 채팅방 목록 만들 때 유용
    // List<ChatRoom> findByWorkerId(Long workerId);
}
