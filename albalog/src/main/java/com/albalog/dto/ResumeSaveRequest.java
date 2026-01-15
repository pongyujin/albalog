package com.albalog.dto;

import java.util.List;

public class ResumeSaveRequest {
    public Integer desiredWage;
    public Boolean wageNegotiable;

    public List<String> days;          // ["MON","TUE"]
    public Boolean daysNegotiable;

    public String timeStart;           // "09:00"
    public String timeEnd;             // "18:00"
    public Boolean timeNegotiable;

    public String introduction;

    public List<ExperienceDto> experiences;
    public List<String> skills;        // ["POS","CS"]

    public static class ExperienceDto {
        public String storeName;
        public String industry;
        public String periodText;
        public String roleText;
    }
}
