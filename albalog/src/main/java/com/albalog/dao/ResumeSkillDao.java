package com.albalog.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.albalog.domain.ResumeSkill;

public interface ResumeSkillDao extends JpaRepository<ResumeSkill, Long> {

    @Modifying
    @Query("delete from ResumeSkill s where s.resume.id = :resumeId")
    void deleteAllByResumeId(@Param("resumeId") Long resumeId);

    List<ResumeSkill> findByResume_Id(Long resumeId);
}
