package com.albalog.service;

import java.time.LocalDate;
import java.time.Period;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.albalog.dao.UserDao;
import com.albalog.domain.User;
import com.albalog.dto.UserSignupDto;

@Service // 이 클래스는 서비스 계층임을 의미
public class UserService {

    private final UserDao userDao;
    private final BCryptPasswordEncoder passwordEncoder;

    // 생성자 주입 (Spring이 자동으로 넣어줌)
    public UserService(UserDao userDao) {
        this.userDao = userDao;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * 회원가입 처리 메서드
     * @param dto : 회원가입 화면에서 넘어온 데이터
     */
    public void signup(UserSignupDto dto) {

        // 1. 아이디 중복 체크
        if (userDao.existsByUsername(dto.getUsername())) {
            throw new IllegalStateException("이미 존재하는 아이디");
        }

        // ✅ phone 필수 체크 (DB가 NOT NULL이라 서버에서 먼저 막아주는 게 좋음)
        if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
            throw new IllegalStateException("전화번호는 필수입니다.");
        }

        // ✅ 하이픈 제거(혹시 프론트에서 안 지웠어도 안전)
        String phone = dto.getPhone().replace("-", "").trim();

        // ✅ 전화번호 형식 간단 체크(10~11자리)
        if (!phone.matches("\\d{10,11}")) {
            throw new IllegalStateException("전화번호 형식이 올바르지 않습니다.");
        }

        // 2. DTO → Entity 변환
        User user = new User();
        user.setUsername(dto.getUsername());

        // 3. 비밀번호 bcrypt 암호화 후 저장
        String encodedPw = passwordEncoder.encode(dto.getPassword());
        user.setPassword(encodedPw);

        user.setName(dto.getName());
        user.setBirth(dto.getBirth());
        user.setPhone(phone);          // ✅✅ 이 줄 추가
        user.setOwner(dto.isOwner());

        // 4. DB 저장
        userDao.save(user);
    }

    public User findById(Long id) {
        return userDao.findById(id)
                .orElseThrow(() -> new RuntimeException("유저 없음"));
    }
    
    // 나이 구하
    public int getAge(LocalDate birth) {
        return Period.between(birth, LocalDate.now()).getYears();
    }



    
    
    // 로그
    public User login(String username, String password) {

        // 1. 아이디로 회원 조회
        User user = userDao.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("아이디 없음"));

        // 2. bcrypt 비밀번호 비교
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalStateException("비밀번호 불일치");
        }

        // 3. 로그인 성공 → User 반환
        return user;
    }
}
