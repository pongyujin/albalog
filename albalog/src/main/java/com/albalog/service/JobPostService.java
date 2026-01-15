package com.albalog.service;

import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.albalog.dao.JobPostRepository;
import com.albalog.domain.JobPost;
import com.albalog.dto.JobPostCreateRequest;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class JobPostService {

    private final JobPostRepository jobPostRepository;
    private final ObjectMapper objectMapper; // ✅ 주입

    public Long createJobPost(Long ownerId, JobPostCreateRequest req) {

        JobPost.WageType wageType = JobPost.WageType.valueOf(req.getWageType());

        // 시간
        LocalTime start = null;
        LocalTime end = null;
        boolean timeNegotiable = Boolean.TRUE.equals(req.getTimeNegotiable());

        if (!timeNegotiable) {
            if (req.getTimeStart() != null && !req.getTimeStart().isBlank()) start = LocalTime.parse(req.getTimeStart());
            if (req.getTimeEnd() != null && !req.getTimeEnd().isBlank()) end = LocalTime.parse(req.getTimeEnd());
        }

        // ✅ 요일 -> daysJson 만들기 (null 방지: "[]")
        String daysJson;
        try {
            var days = (req.getDays() == null) ? java.util.List.<String>of() : req.getDays();
            daysJson = objectMapper.writeValueAsString(days); // "[]", ["MON", ...]
        } catch (Exception e) {
            throw new IllegalArgumentException("days 변환 실패", e);
        }

        JobPost post = JobPost.builder()
                .ownerId(ownerId)
                .storeName(req.getStoreName())
                .title(req.getTitle())
                .wage(req.getWage())
                .wageType(wageType)
                .daysJson(daysJson)               // ✅ 여기!
                .timeStart(start)
                .timeEnd(end)
                .timeNegotiable(timeNegotiable)
                .regionCity(req.getRegionCity())
                .regionDistrict(req.getRegionDistrict())
                .addressDetail(req.getAddressDetail())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .status(JobPost.Status.OPEN)
                .build();

        return jobPostRepository.save(post).getId();
    }
    
    // ✅ (추가) 홈용: 전체 공고 조회
    public List<JobPost> getPublicJobPosts(String regionCity, String regionDistrict) {

        // 아무 필터 없으면 전체
        if (regionCity == null || regionCity.isBlank()) {
            return jobPostRepository.findAllByOrderByCreatedAtDesc();
        }

        // "광주 전체" 같은 케이스(시만)
        if (regionDistrict == null || regionDistrict.isBlank()) {
            return jobPostRepository.findByRegionCityOrderByCreatedAtDesc(regionCity);
        }

        // 시 + 구
        return jobPostRepository.findByRegionCityAndRegionDistrictOrderByCreatedAtDesc(regionCity, regionDistrict);
    }

    public List<JobPost> findByOwnerId(Long ownerId) {
        return jobPostRepository.findByOwnerId(ownerId);
    }
    
}