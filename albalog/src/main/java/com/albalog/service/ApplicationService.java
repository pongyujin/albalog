package com.albalog.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ApplicationRepository;
import com.albalog.dao.JobPostRepository;
import com.albalog.dao.ResumeDao;
import com.albalog.dao.ResumeExperienceDao;
import com.albalog.dao.UserDao;
import com.albalog.domain.Application;
import com.albalog.domain.JobPost;
import com.albalog.domain.Resume;
import com.albalog.domain.User;
import com.albalog.dto.ApplicationRequest;
import com.albalog.dto.ApplicationResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostRepository jobPostRepository;
    private final ResumeDao resumeDao;
    private final UserDao userDao;
    private final ResumeExperienceDao expDao;

    // ✅ 지원 등록
 // ✅ 지원 등록
    @Transactional
    public void apply(Long userId, ApplicationRequest request) {

        // ✅ 1. 유저 확인
        User user = userDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // ✅ 2. 공고 확인
        JobPost jobPost = jobPostRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다."));

        // ✅ 3. 중복 지원 방지
        if (applicationRepository.existsByUserAndJobPost(user, jobPost)) {
            throw new IllegalStateException("이미 해당 공고에 지원했습니다.");
        }

        // ✅ 4. 유저의 이력서 가져오기 (있을 경우)
        Resume resume = resumeDao.findByUserId(userId)
                .map(r -> resumeDao.getReferenceById(r.getId())) // Lazy proxy로 가져오기
                .orElse(null);

        // ✅ 5. Application 객체 생성 (빌더)
        Application.ApplicationBuilder builder = Application.builder()
                .user(user)
                .jobPost(jobPost)
                .resume(resume); // ✅ 이력서 연결 핵심!

        // ✅ 6. 지원 방식 분기
        if (Boolean.TRUE.equals(request.getUseResume())) {
            // 🔹 “이력서로 지원하기” 선택 시
            if (resume == null) {
                throw new IllegalStateException("저장된 이력서가 없습니다.");
            }

            String intro = "희망 시급: " +
                    (resume.getDesiredWage() != null ? resume.getDesiredWage() + "원" : "협의") +
                    " / 근무 요일: " +
                    (resume.getWorkingDays() != null ? resume.getWorkingDays() : "미입력");

            builder.intro(intro);
            builder.description(resume.getIntroduction());
        } else {
            // 🔹 간단 지원 시
            builder.intro(request.getIntro());
            builder.description(request.getDesc());
        }

        // ✅ 7. DB 저장
        Application saved = applicationRepository.save(builder.build());

        // ✅ 8. 로그로 확인
        System.out.println("📨 지원 등록 완료: appId=" + saved.getId()
                + ", user=" + user.getName()
                + ", jobPost=" + jobPost.getTitle()
                + ", resumeId=" + (resume != null ? resume.getId() : "없음"));
    }


    // ✅ 알바생 입장 - 내 지원 내역
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(Long userId) {
        List<Application> list = applicationRepository.findByUserId(userId);
        return list.stream().map(ApplicationResponse::new).toList();
    }

    // ✅ 사장님 입장 - 내 공고 지원자 목록
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicantsByJob(Long jobId, Long ownerId) {
        System.out.println("📣 jobId = " + jobId + ", ownerId = " + ownerId);

        JobPost post = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다."));

        System.out.println("✅ post = " + post.getTitle());

        if (!post.getOwnerId().equals(ownerId)) {
            throw new IllegalStateException("본인 공고만 조회할 수 있습니다.");
        }
        // ✅ 거절된 지원자(REJECTED)는 제외
        List<Application> apps = applicationRepository.findByJobPostIdAndStatusNot(jobId, Application.Status.REJECTED);
        System.out.println("🧾 조회된 지원자 수: " + apps.size());

        return apps.stream().map(a -> {
            // ✅ Lazy 로딩 강제 초기화 (이력서 포함)
            var resume = a.getResume();
            if (resume != null) {
                resume.getExperiences().size();
                resume.getSkills().size();
            }

            return new ApplicationResponse(a);
        }).toList();
    }
    



}
