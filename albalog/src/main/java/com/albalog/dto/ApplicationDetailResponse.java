package com.albalog.dto;

import com.albalog.domain.Application;
import lombok.Getter;

@Getter
public class ApplicationDetailResponse {
    private Long id;
    private String applicantName;
    private String intro;
    private String description;
    private String phone;
    private String resumeSummary;

    public ApplicationDetailResponse(Application app, int expCount) {
        this.id = app.getId();
        this.applicantName = app.getUser().getName();
        this.intro = app.getIntro();
        this.description = app.getDescription();
        this.phone = app.getUser().getPhone();

        if (app.getResume() != null) {
            this.resumeSummary = String.format("희망시급: %s원 / 경력: %s",
                    app.getResume().getDesiredWage(),
                    (expCount == 0 ? "없음" : expCount + "건"));
        } else {
            this.resumeSummary = "이력서 없이 지원";
        }
    }
}
