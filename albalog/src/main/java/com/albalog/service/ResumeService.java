package com.albalog.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.albalog.dao.ResumeDao;
import com.albalog.dao.ResumeExperienceDao;
import com.albalog.dao.ResumeSkillDao;
import com.albalog.dao.UserDao;
import com.albalog.domain.Resume;
import com.albalog.domain.ResumeExperience;
import com.albalog.domain.ResumeSkill;
import com.albalog.domain.User;
import com.albalog.dto.ResumeResponse;
import com.albalog.dto.ResumeSaveRequest;

@Service
public class ResumeService {
	private final ResumeDao resumeDao;
	private final ResumeExperienceDao expDao;
	private final ResumeSkillDao skillDao;
	private final UserDao userDao; // ✅ 추가

	public ResumeService(ResumeDao resumeDao, ResumeExperienceDao expDao,
	                     ResumeSkillDao skillDao, UserDao userDao) {
	    this.resumeDao = resumeDao;
	    this.expDao = expDao;
	    this.skillDao = skillDao;
	    this.userDao = userDao;
	}


    @Transactional(readOnly = true)
    public Optional<ResumeResponse> getMyResume(Long userId) {
        Optional<Resume> opt = resumeDao.findByUserId(userId);
        if (opt.isEmpty()) return Optional.empty();

        Resume r = opt.get();
        ResumeResponse resp = new ResumeResponse(r);

        resp.desiredWage = r.getDesiredWage();
        resp.wageNegotiable = r.isWageNegotiable();
        resp.daysNegotiable = r.isDaysNegotiable();
        resp.timeNegotiable = r.isTimeNegotiable();
        resp.introduction = r.getIntroduction();

        resp.days = csvToList(r.getWorkingDays());
        resp.timeStart = (r.getTimeStart() != null) ? r.getTimeStart().toString() : null;
        resp.timeEnd = (r.getTimeEnd() != null) ? r.getTimeEnd().toString() : null;

        List<ResumeExperience> exps = expDao.findByResume_IdOrderBySortOrderAsc(r.getId());
        for (ResumeExperience e : exps) {
            ResumeResponse.Experience x = new ResumeResponse.Experience();
            x.storeName = e.getStoreName();
            x.industry = e.getIndustry();
            x.periodText = e.getPeriodText();
            x.roleText = e.getRoleText();
            resp.experiences.add(x);
        }

        List<ResumeSkill> skills = skillDao.findByResume_Id(r.getId());
        resp.skills = skills.stream()
                .map(ResumeSkill::getSkillCode)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        return Optional.of(resp);
    }

    @Transactional
    public void saveOrUpdate(Long userId, ResumeSaveRequest req) {
        Resume resume = resumeDao.findByUserId(userId).orElseGet(() -> {
            Resume r = new Resume();
            r.setUserId(userId);
            return r;
        });

        // ✅ user 객체 직접 연결 (이 부분 추가!)
        User user = userDao.getReferenceById(userId);
        resume.setUser(user);
        
        resume.setDesiredWage(req.desiredWage);
        resume.setWageNegotiable(bool(req.wageNegotiable));
        resume.setDaysNegotiable(bool(req.daysNegotiable));
        resume.setTimeNegotiable(bool(req.timeNegotiable));
        resume.setIntroduction(emptyToNull(req.introduction));

        // days list -> CSV
        resume.setWorkingDays(listToCsv(req.days));

        // "09:00" -> LocalTime
        resume.setTimeStart(parseTime(req.timeStart));
        resume.setTimeEnd(parseTime(req.timeEnd));

        // ✅ 1) 저장 (id 확보)
        resume = resumeDao.save(resume);

        Long resumeId = resume.getId();
        System.out.println("📄 이력서 저장됨! id=" + resumeId + " (userId=" + userId + ")");

        // ✅ 2) 경력/스킬 재저장
        expDao.deleteByResume_Id(resumeId);
        skillDao.deleteAllByResumeId(resumeId);

        if (req.experiences != null) {
            int order = 0;
            for (ResumeSaveRequest.ExperienceDto dto : req.experiences) {
                if (dto == null) continue;
                if (isAllBlank(dto.storeName, dto.industry, dto.periodText, dto.roleText)) continue;

                ResumeExperience e = new ResumeExperience();
                e.setResume(resume);
                e.setStoreName(emptyToNull(dto.storeName));
                e.setIndustry(emptyToNull(dto.industry));
                e.setPeriodText(emptyToNull(dto.periodText));
                e.setRoleText(emptyToNull(dto.roleText));
                e.setSortOrder(order++);
                expDao.save(e);
            }
        }

        if (req.skills != null) {
            Set<String> uniq = req.skills.stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            for (String code : uniq) {
                ResumeSkill s = new ResumeSkill();
                s.setResume(resume);
                s.setSkillCode(code);
                skillDao.save(s);
            }
        }
    }


    private boolean bool(Boolean b) {
        return b != null && b;
    }

    private LocalTime parseTime(String t) {
        if (t == null || t.isBlank()) return null;
        return LocalTime.parse(t);
    }

    private String emptyToNull(String s) {
        if (s == null) return null;
        String x = s.trim();
        return x.isEmpty() ? null : x;
    }

    private boolean isAllBlank(String... arr) {
        for (String s : arr) {
            if (s != null && !s.trim().isEmpty()) return false;
        }
        return true;
    }

    private String listToCsv(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        List<String> cleaned = list.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
        return cleaned.isEmpty() ? null : String.join(",", cleaned);
    }

    private List<String> csvToList(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }
    
    
}
