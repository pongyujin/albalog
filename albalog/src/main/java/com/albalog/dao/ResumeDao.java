package com.albalog.dao;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.albalog.domain.Resume;

public interface ResumeDao extends JpaRepository<Resume, Long> {
    Optional<Resume> findByUserId(Long userId);
}
