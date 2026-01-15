package com.albalog.domain;

import jakarta.persistence.*;

import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "job_posts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: users.id (사장님)
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "store_name", nullable = false, length = 100)
    private String storeName;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false)
    private Integer wage;

    @Enumerated(EnumType.STRING)
    @Column(name = "wage_type", nullable = false)
    private WageType wageType;

    // JSON 컬럼은 일단 String으로 저장해도 됨 (예: ["MON","TUE"])
    @Column(name = "days_json", nullable = false, columnDefinition = "json")
    private String daysJson;

    @Column(name = "time_start")
    private LocalTime timeStart;

    @Column(name = "time_end")
    private LocalTime timeEnd;

    @Column(name = "time_negotiable", nullable = false)
    private Boolean timeNegotiable;

    @Column(name = "region_city", nullable = false, length = 50)
    private String regionCity;

    @Column(name = "region_district", nullable = false, length = 50)
    private String regionDistrict;

    @Column(name = "address_detail", length = 200)
    private String addressDetail;

    @Lob
    @Column
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public enum WageType { HOURLY, NEGOTIABLE }
    public enum Status { OPEN, CLOSED }
}
