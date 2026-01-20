package com.albalog.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.albalog.domain.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // ✅ 히스토리 로딩: 최신순/과거순은 서비스에서 정렬 정책 잡으면 됨
    List<ChatMessage> findTop50ByRoomIdOrderByIdDesc(Long roomId);
}
