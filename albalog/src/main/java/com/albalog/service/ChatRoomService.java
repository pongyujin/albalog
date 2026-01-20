package com.albalog.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ChatRoomReadRepository;
import com.albalog.dao.ChatRoomRepository;
import com.albalog.domain.Application;
import com.albalog.domain.ChatRoom;
import com.albalog.domain.ChatRoomRead;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomReadRepository chatRoomReadRepository;

    @Transactional
    public ChatRoom createIfAbsent(Application app) {

        // ✅ 0) 방은 "채용된 지원서"만 만들어야 하므로
        //    혹시 여기로 채용 아닌 상태가 들어오면 막아도 됨(방어 코드)
        if (app.getStatus() != Application.Status.ACCEPTED) {
            throw new IllegalStateException("채용된 지원서만 채팅방을 생성할 수 있습니다.");
        }

        // ✅ 1) 이미 방이 있으면 그대로 반환
        var existed = chatRoomRepository.findByApplicationId(app.getId()).orElse(null);
        if (existed != null) {
            return existed;
        }

        // ✅ 2) room 생성에 필요한 값 준비
        // - worker = 지원자 (applications.user_id)
        // - owner  = 공고 작성자 (job_posts.owner_id)
        Long applicationId = app.getId();
        Long jobPostId = app.getJobPost().getId();
        Long ownerId = app.getJobPost().getOwnerId();
        Long workerId = app.getUser().getId();

        try {
            // ✅ 3) 채팅방 생성 + 저장
            ChatRoom saved = chatRoomRepository.save(
                    new ChatRoom(applicationId, jobPostId, ownerId, workerId)
            );

            // ✅ 4) 읽음 row 2개 생성 (owner/worker)
            // - lastReadMessageId / lastReadAt은 null로 시작
            chatRoomReadRepository.save(ChatRoomRead.forUser(saved.getId(), ownerId));
            chatRoomReadRepository.save(ChatRoomRead.forUser(saved.getId(), workerId));

            return saved;

        } catch (DataIntegrityViolationException e) {
            // ✅ 5) 동시에 생성 시도한 경우 UNIQUE(application_id)에 걸릴 수 있음
            // -> 다시 조회해서 반환하면 안정적
            return chatRoomRepository.findByApplicationId(applicationId)
                    .orElseThrow(() -> new IllegalStateException("채팅방 생성 중 오류가 발생했습니다."));
        }
    }
}
