select * from users;
select * from users where username = 'own';


CREATE TABLE resumes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,

  desired_wage INT NULL,
  wage_negotiable TINYINT(1) NOT NULL DEFAULT 0,

  working_days VARCHAR(100) NULL,          -- "MON,TUE,WED"
  days_negotiable TINYINT(1) NOT NULL DEFAULT 0,

  time_start TIME NULL,
  time_end TIME NULL,
  time_negotiable TINYINT(1) NOT NULL DEFAULT 0,

  introduction TEXT NULL,

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_resumes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);


CREATE TABLE resume_experiences (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  resume_id BIGINT NOT NULL,

  store_name VARCHAR(100) NULL,
  industry VARCHAR(50) NULL,
  period_text VARCHAR(100) NULL,
  role_text VARCHAR(100) NULL,

  sort_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_resume_experiences_resume
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_resume_experiences_resume_id ON resume_experiences(resume_id);

CREATE TABLE resume_skills (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  resume_id BIGINT NOT NULL,
  skill_code VARCHAR(30) NOT NULL,         -- POS, SERVING, ...

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_resume_skills_resume
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_resume_skill UNIQUE (resume_id, skill_code)
);

CREATE INDEX idx_resume_skills_resume_id ON resume_skills(resume_id);


CREATE TABLE applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,              -- 지원자 (알바생)
    job_post_id BIGINT NOT NULL,          -- 지원한 공고
    resume_id BIGINT NULL,                -- 이력서로 지원 시 연결
    intro TEXT NULL,                      -- 한 줄 소개 (간단 지원용)
    description TEXT NULL,                -- 자기소개 / 경력
    status ENUM('PENDING','READ','ACCEPTED','REJECTED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    viewed_at DATETIME NULL,

    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
);


select * from job_posts;
select * from resumes;
select * from resume_experiences;

select * from applications;

select * from users;
SELECT * FROM resumes WHERE user_id = 2;

SELECT id, username, name FROM users;
SELECT id, user_id, desired_wage, introduction FROM resumes;

SELECT id, user_id, resume_id, job_post_id, intro, description
FROM applications;


