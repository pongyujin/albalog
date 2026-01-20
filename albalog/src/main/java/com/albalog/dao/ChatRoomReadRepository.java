package com.albalog.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.albalog.domain.ChatRoomRead;

public interface ChatRoomReadRepository extends JpaRepository<ChatRoomRead, Long> {

    // ✅ 특정 방에서 특정 유저의 읽음 상태 조회
    Optional<ChatRoomRead> findByRoomIdAndUserId(Long roomId, Long userId);
}
