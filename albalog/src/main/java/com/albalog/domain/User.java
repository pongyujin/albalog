package com.albalog.domain;

import java.time.LocalDate;

import org.springframework.data.annotation.Transient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;   // 아이디

    @Column(nullable = false)
    private String password;   // bcrypt 해시

    @Column(nullable = false)
    private String name;       // 이름

    @Column(nullable = false)
    private LocalDate birth;   // 생년월일
    
    @Column(name="phone", nullable = false, length = 20)
    private String phone;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    @Column(name = "is_owner", nullable = false)
    private boolean owner;     // 사장님 여부
    
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Resume resume;
    
    @Transient
    public int getAge() {
        if (birth == null) return 0;
        return java.time.Period.between(birth, java.time.LocalDate.now()).getYears();
    }

    public Resume getResume() {
        return resume;
    }
    public void setResume(Resume resume) {
        this.resume = resume;
    }


    // ===== getter / setter =====
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getBirth() {
        return birth;
    }
    public void setBirth(LocalDate birth) {
        this.birth = birth;
    }

    public boolean isOwner() {
        return owner;
    }
    public void setOwner(boolean owner) {
        this.owner = owner;
    }
}
