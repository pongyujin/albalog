package com.albalog.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.albalog.domain.User;

public interface UserDao extends JpaRepository<User, Long> {

	// 회원가
    boolean existsByUsername(String username);
    
    // 로그인 시 아이디로 회원 조회
    Optional<User> findByUsername(String username);
}
