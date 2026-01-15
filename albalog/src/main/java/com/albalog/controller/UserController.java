package com.albalog.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.albalog.dao.UserDao;
import com.albalog.domain.User;
import com.albalog.dto.UserLoginDto;
import com.albalog.dto.UserSignupDto;
import com.albalog.service.UserService;

import jakarta.servlet.http.HttpSession;

@RestController // JSON 요청/응답 전용 컨트롤러
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    
    private final UserDao userDao;

    public UserController(UserService userService, UserDao userDao) {
        this.userService = userService;
        this.userDao = userDao;
    }

    
    // 회원가입 API
    // JS에서 POST /api/users/signup 호출
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserSignupDto dto) {
        try {
        	System.out.println("유저 컨트롤러 사인업!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            userService.signup(dto);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // ⭐ 콘솔에 에러 찍기
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    
    // 로그
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto dto, HttpSession session) {

        // 1) 아이디/비번 검증 (성공하면 User 리턴하도록 서비스에서 만들어둔 상태)
        User user = userService.login(dto.getUsername(), dto.getPassword());

        // 2) 세션에 로그인 정보 저장 (서버가 기억함)
        session.setAttribute("LOGIN_USER_ID", user.getId());
        session.setAttribute("LOGIN_USER_NAME", user.getName()); // "정유진"
        session.setAttribute("LOGIN_IS_OWNER", user.isOwner());

        // 3) 프론트(JS)가 바로 쓸 수 있게 최소 정보만 내려줌
        Map<String, Object> body = new HashMap<>();
        body.put("name", user.getName());
        body.put("isOwner", user.isOwner());

        return ResponseEntity.ok(body);
    }
    
    


    // 현재 로그인한 사람 확인 API 
    // JS가 새로고침을 해도 세션이 살아있음 이름 다시 표기하게 하
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {

        Long userId = (Long) session.getAttribute("LOGIN_USER_ID");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userService.findById(userId);

        Map<String, Object> body = new HashMap<>();
        body.put("id", user.getId());
        body.put("name", user.getName());
        body.put("phone", user.getPhone());
        body.put("age", userService.getAge(user.getBirth()));
        body.put("isOwner", user.isOwner());   // ✅ 추가



        return ResponseEntity.ok(body);
    }



    
    // 로그아
    @PostMapping("/logout")
    public void logout(HttpSession session) {
        // 세션 통째로 날림 = 로그아웃
        session.invalidate();
    }




}
