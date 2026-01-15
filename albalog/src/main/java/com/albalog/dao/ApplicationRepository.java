package com.albalog.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.albalog.domain.Application;
import com.albalog.domain.Application.Status;
import com.albalog.domain.JobPost;
import com.albalog.domain.User;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // ✅ 특정 공고에 지원한 사람 목록
    List<Application> findByJobPost(JobPost jobPost);

    // ✅ 특정 사용자(알바생)의 지원 내역
    List<Application> findByUser(User user);

    // ✅ 같은 공고에 중복 지원했는지 체크 (user_id + job_post_id)
    boolean existsByUserAndJobPost(User user, JobPost jobPost);
    
    // ✅ 사용자 ID 기반 지원 내역
    List<Application> findByUserId(Long userId);

    // ✅ 공고 ID 기반 지원자 목록 (JobPost 객체 말고 ID 직접 받기)
    List<Application> findByJobPostId(Long jobPostId);
    List<Application> findByJobPostIdAndStatusNot(Long jobPostId, Application.Status status);

    
    
}
