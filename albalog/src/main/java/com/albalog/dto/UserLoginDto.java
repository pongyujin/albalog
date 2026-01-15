package com.albalog.dto;

public class UserLoginDto {

    private String username;
    private String password;

    // 아이디
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    // 비밀번호 (평문, 서버에서 비교만 함)
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
}
