package com.albalog.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.albalog.domain.JobPost;

@Repository
public interface JobPostRepository extends JpaRepository<JobPost, Long> {

    // 사장님이 올린 공고 목록
    List<JobPost> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    // ✅ 전체 공고 (최신순)
    List<JobPost> findAllByOrderByCreatedAtDesc();

    // ✅ 지역 필터 (시)
    List<JobPost> findByRegionCityOrderByCreatedAtDesc(String regionCity);

    // ✅ 지역 필터 (시 + 구)
    List<JobPost> findByRegionCityAndRegionDistrictOrderByCreatedAtDesc(
        String regionCity,
        String regionDistrict
    );
    
    List<JobPost> findByOwnerId(Long ownerId);
}
