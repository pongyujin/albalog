package com.albalog.dao;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.albalog.domain.ResumeExperience;

public interface ResumeExperienceDao extends JpaRepository<ResumeExperience, Long> {
    List<ResumeExperience> findByResume_IdOrderBySortOrderAsc(Long resumeId);
    void deleteByResume_Id(Long resumeId);
    int countByResume_Id(Long resumeId); // ✅ 이거 꼭 추가!
}
