USE piece_db;

-- 1. 테스트 회원
-- 공통 테스트 비밀번호: PieceTest123!
-- password_hash에는 bcrypt 해시 저장
INSERT INTO users (
    email,
    nickname,
    password_hash,
    role,
    collaboration_mode,
    active_times,
    intro
)
VALUES 
(
    'leader@example.com',
    '테스트팀장',
    -- 테스트 회원의 해시
    '$2b$10$0R4eNWqrMhv/soIvAIQad.YY4jwnBi2mGAE3669FmU55c15UptETK',
    'USER',
    'ONLINE',
    'WEEKDAY_NIGHT,WEEKEND_AM',
    '프로젝트를 모집하는 테스트 회원입니다.'
),
(
    'member@example.com',
    '테스트팀원',
    '$2b$10$0R4eNWqrMhv/soIvAIQad.YY4jwnBi2mGAE3669FmU55c15UptETK',
    'USER',
    'ANY',
    'WEEKDAY_NIGHT,WEEKEND_AM',
    '프로젝트에 참여한 테스트 회원입니다.'
),
(
    'applicant@example.com',
    '테스트지원자',
    '$2b$10$0R4eNWqrMhv/soIvAIQad.YY4jwnBi2mGAE3669FmU55c15UptETK',
    'USER',
    'ONLINE',
    'WEEKDAY_NIGHT',
    '참여 요청을 보내는 테스트 회원입니다.'
),
(
    'admin@example.com',
    '테스트관리자',
    '$2b$10$0R4eNWqrMhv/soIvAIQad.YY4jwnBi2mGAE3669FmU55c15UptETK',
    'ADMIN',
    'ANY',
    'WEEKDAY_DAY',
    '신고 처리용 테스트 관리자입니다.'
);

-- 2. 테스트 프로젝트
INSERT INTO projects (
    author_id,
    title,
    content,
    meeting_method,
    target_level,
    capacity,
    progress_mode,
    active_times,
    deadline
)
VALUES (
    (SELECT id FROM users WHERE email = 'leader@example.com'),
    '초보자를 위한 할일 관리 웹',
    'React와 Express로 할일 관리 웹을 만드는 프로젝트입니다.',
    '온라인 회으로 진행하고 GitHub에서 작업 내용을 공유합니다.',
    'STARTER',
    4,
    'ONLINE',
    'WEEKDAY_NIGHT,WEEKEND_AM',
    DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY)
);

-- 방금 생성한 프로젝트 번호 보관
SET @seed_project_id = LAST_INSERT_ID();

-- 3. 프로젝트 팀원: 작성자와 참여 회원
INSERT INTO project_members (
    project_id,
    user_id,
    role
)
VALUES
(
    @seed_project_id,
    (SELECT id FROM users WHERE email = 'leader@example.com'),
    'LEADER'
),
(
    @seed_project_id,
    (SELECT id FROM users WHERE email = 'member@example.com'),
    'MEMBER'
);

-- 4. 참여 요청
INSERT INTO project_requests (
    project_id,
    sender_id,
    receiver_id,
    type,
    status,
    message
)
VALUES (
    @seed_project_id,
    (SELECT id FROM users WHERE email = 'applicant@example.com'),
    (SELECT id FROM users WHERE email = 'leader@example.com'),
    'APPLY',
    'PENDING',
    '프로젝트에 참여해서 함께 배우고 싶습니다.'
);

-- 5. 질문
INSERT INTO questions (
    author_id,
    project_id,
    title,
    content
)
VALUES
(
    (SELECT id FROM users WHERE email = 'member@example.com'),
    NULL,
    'Express에서 DB 연결은 어떻게 하나요?',
    'mysql2 연결 풀을 사용하는 방법이 궁금합니다.'
),
(
    (SELECT id FROM users WHERE email = 'applicant@example.com'),
    @seed_project_id,
    '프로젝트 참여 전에 준비할 것이 있나요?',
    'React 기초를 공부한 상태인데 참여할 수 있을까요?'
);

-- 6. 답변
-- 앞서 입력한 테스트 질문 번호 조회
SET @seed_general_question_id = (
    SELECT id
    FROM questions
    WHERE author_id = (
        SELECT id FROM users WHERE email = 'member@example.com'
    )
    AND project_id IS NULL
    AND title = 'Express에서 DB 연결은 어떻게 하나요?'
    ORDER BY id DESC
    LIMIT 1
);

SET @seed_project_question_id = (
    SELECT id
    FROM questions
    WHERE author_id = (
        SELECT id FROM users WHERE email = 'applicant@example.com'
    )
    AND project_id = @seed_project_id
    AND title = '프로젝트 참여 전에 준비할 것이 있나요?'
    ORDER BY id DESC
    LIMIT 1
);

INSERT INTO answers (
    question_id,
    author_id,
    content
)
VALUES
(
    @seed_general_question_id,
    (SELECT id FROM users WHERE email = 'leader@example.com'),
    'mysql2의 createPool로 연결 풀을 만들고 사용하면 됩니다.'
),
(
    @seed_project_question_id,
    (SELECT id FROM users WHERE email = 'leader@example.com'),
    'React 기초를 알고 계시면 첨여할 수 있습니다.'
);

-- 7. 신고
-- 실제 부적절한 내용이 아닌, 신고 기능 확인용 테스트 데이터
INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    detail
)
VALUES (
    (SELECT id FROM users WHERE email = 'applicant@example.com'),
    'QUESTION',
    @seed_general_question_id,
    'ETC',
    '관리자 신고 처리 기능을 확인하기 위한 테스트입니다.'
);