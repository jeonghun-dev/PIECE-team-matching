-- PIECE 프로젝트 DB
CREATE DATABASE IF NOT EXISTS piece_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE piece_db;

-- 1. 회원: 계정, 프로필, 학습 이력
CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    nickname VARCHAR(30) NOT NULL,
    password_hash VARCHAR (255) NOT NULL,

    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',

    intro VARCHAR(200) NULL,
    collaboration_mode ENUM('ONLINE', 'OFFLINE', 'ANY') NOT NULL,
    active_times SET(
        'WEEKDAY_DAY',
        'WEEKDAY_NIGHT',
        'WEEKEND_AM',
        'WEEKEND_PM'
    ) NOT NULL,
    looking_for_team TINYINT(1) NOT NULL DEFAULT 1,
    portfolio_url VARCHAR(500) NULL,

    certificates SET(
        'ENGINEER',
        'INDUSTRIAL',
        'SQLD',
        'LINUX',
        'PROGRAMMING',
        'ADSP'
    ) NOT NULL DEFAULT '',
    award_count INT NOT NULL DEFAULT 0,
    project_count INT NOT NULL DEFAULT 0,
    total_score DECIMAL(4,1) NOT NULL DEFAULT 0.0,
    level ENUM('STARTER', 'BUILDER', 'ACHIEVER')
        NOT NULL DEFAULT 'STARTER',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_nickname UNIQUE (nickname),
    CONSTRAINT ck_users_counts
        CHECK (award_count >= 0 AND project_count >= 0),
    CONSTRAINT ck_users_active_times
        CHECK (active_times <> ''),
    INDEX idx_users_find (looking_for_team, level, status)
) ENGINE=InnoDB;

-- 2. 프로젝트 모집 글
CREATE TABLE projects (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,

    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    meeting_method TEXT NOT NULL,

    target_level ENUM('STARTER', 'BUILDER', 'ACHIEVER') NOT NULL,
    capacity TINYINT NOT NULL,
    progress_mode ENUM('ONLINE', 'OFFLINE', 'HYBRID') NOT NULL,
    active_times SET(
        'WEEKDAY_DAY',
        'WEEKDAY_NIGHT',
        'WEEKEND_AM',
        'WEEKEND_PM'
    ) NOT NULL,

    deadline DATE NOT NULL,
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    view_count INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_projects_author
        FOREIGN KEY (author_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    CONSTRAINT ck_projects_capacity
        CHECK (capacity BETWEEN 2 AND 5),

    CONSTRAINT ck_projects_active_times
        CHECK (active_times <> ''),

    INDEX idx_projects_list (
        deleted_at, status, target_level, created_at
    ),
    INDEX idx_projects_deadline (status, deadline) 
) ENGINE=InnoDB;

-- 3. 프로젝트 팀원
CREATE TABLE project_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- 핵심 부분: ex) 1번 프젝에 3번 회원 등록 = 가능 / 1번 프젝에 3번 회원 다시 등록 != 중복 차단 / 2번 프젝에 3번 회원 등록 = 가능 -> 다른 팀 동시 참여 허용
    CONSTRAINT uk_project_member
        UNIQUE (project_id, user_id),
    
    CONSTRAINT fk_members_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    CONSTRAINT fk_members_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_members_user (user_id)
) ENGINE=InnoDB;

-- 4. 참여/초대 요청
CREATE TABLE project_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,

    type ENUM('APPLY', 'INVITE') NOT NULL,
    status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'CANCELED'
    ) NOT NULL DEFAULT 'PENDING',

    message VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_requests_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    
    CONSTRAINT fk_requests_sender
        FOREIGN KEY (sender_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    
    CONSTRAINT fk_requests_receiver
        FOREIGN KEY (receiver_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_requests_received (receiver_id, status),
    INDEX idx_requests_sent (sender_id, status),
    INDEX idx_requests_project (project_id, status)
) ENGINE=InnoDB;

-- 5. 질문
CREATE TABLE questions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    project_id BIGINT NULL,

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    is_solved TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_questions_author
        FOREIGN KEY (author_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    CONSTRAINT fk_questions_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_questions_board (
        project_id, deleted_at, is_solved, created_at
    )
) ENGINE=InnoDB;

-- 6. 답변
CREATE TABLE answers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_accepted TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id) REFERENCES questions (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    CONSTRAINT fk_answers_author
        FOREIGN KEY (author_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_answers_question (
        question_id, deleted_at, created_at
    )
) ENGINE=InnoDB;

-- 7. 신고
-- 참고: target_id 에는 외래키를 걸지 않음 -> 대상 종류에 따라 참조할 테이블이 달라지므로, 대상이 실제로 존재하는지와 본인 글인지 여부는 서버에서 검사!!!
CREATE TABLE reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,

    target_type ENUM('PROJECT', 'QUESTION', 'ANSWER') NOT NULL,
    target_id BIGINT NOT NULL,
    reason ENUM('ABUSE', 'AD', 'PROMOTION', 'ETC') NOT NULL,
    detail VARCHAR(500) NULL,

    status ENUM('PENDING', 'RESOLVED', 'REJECTED')
        NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    CONSTRAINT uk_reports_once
        UNIQUE (reporter_id, target_type, target_id),

    INDEX idx_reports_status (status, created_at)
) ENGINE=InnoDB;