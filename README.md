# BEJV27-1st-6TEAM

# PIECE

> 비전공자 취준생을 위한 프로젝트 팀 빌딩 및 Q&A 플랫폼

## 프로젝트 소개

- 타깃 사용자: 팀프로젝트를 진행하고 싶은 비전공자 취준생
- 해결하려는 문제: 주변에서 함께 프로젝트를 진행할 자신의 실력에 맞는 팀원을 찾기 어렵다. 비전공자 취준생이 진행할 프로젝트가 거의 존재하지 않는다.
- 차별화 기능: 비전공자 취준생 맞춤형 양방향 프로젝트 매칭 서비스

## 주요 기능

- 비전공자 취준생 맞춤형 배점 기준 제공
- 점수 기반 팀원 추천 및 제안

## 기술 스택

| 구분 | 기술 | 버전 |
| --- | --- | --- |
| Frontend | React | 19.3.1 |
| | Vite | 8.3.5 |
| | react-dom | 19.3.1 |
| | react-router-dom | 7.18.5 |
| | axios | 1.21.0 |
| | ESLint | 10.14.0 |
| Backend | Node.js | 24.21.0 |
| | Express | 5.3.0 |
| | mysql2 | 3.24.6 |
| | bcrypt | 6.0.0 |
| | jsonwebtoken | 9.0.3 |
| | dotenv | 18.0.9 |
| | cors | 2.8.6 |
| | nodemon (개발용) | 3.1.14 |
| | node-cron | 4.6.0 |
| DB | MySQL Community Server | 26.7.0 |

## 개발 환경 (팀 전원 통일)

| 항목 | 버전/도구 |
| --- | --- |
| Node.js | v24.21.0 (LTS) |
| npm | 11.19.0 |
| DB | MySQL Community Server 26.7.0 + MySQL Workbench |
| 에디터 | VS Code + ESLint, Prettier 확장 |
| API 테스트 | Postman 또는 Thunder Client |

## 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/likelion-backendschool-10th/BEJV27-1st-6TEAM.git
cd BEJV27-1st-6TEAM

# 2. DB 생성 (MySQL 기준)
MySQL Workbench에서 아래 순서대로 실행합니다. (File → Open SQL Script → 실행)
| 순서 | 파일 | 설명 |
| --- | --- | --- |
| 1 | backend/db/schema.sql | piece_db 데이터베이스와 테이블 7개 생성 |
| 2 | backend/db/newSeed.sql | 테스트 데이터 입력 (기존 데이터를 비우고 다시 넣음) |

터미널(MySQL CLI)로 실행할 경우:
mysql -u root -p < backend/db/schema.sql
mysql -u root -p < backend/db/newSeed.sql

테스트 계정 (공통 비밀번호 test1234!)
| 이메일 | 권한 |
| --- | --- |
| leader@example.com | 일반 회원 (모집자) |
| member@example.com | 일반 회원 (팀원) |
| applicant@example.com | 일반 회원 (지원자) |
| admin@example.com | 관리자 |
schema.sql은 테이블이 이미 있으면 오류가 납니다. 처음부터 다시 만들려면 DROP DATABASE piece_db; 후 실행하세요.
2026-11-10 이전에 DB를 만든 경우에만 backend/db/migrations/20261110_add_request_notification_read_at.sql을 추가로 실행합니다.

# 3. 백엔드
cd backend
cp .env.example .env   # .env에 DB 비밀번호, JWT_SECRET 채우기
npm install
npm run dev

# 4. 프론트엔드 (새 터미널)
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## 폴더 구조

```
BEJV27-1st-6TEAM/
├── frontend/ # React (Vite)
│ └── src/
│       ├── api/ # axios 인스턴스, 도메인별 API 함수
│       ├── components/ # 공통·재사용 컴포넌트 (LevelBadge 등)
│       ├── constants/ # 코드값·라벨 상수
│       ├── hooks/ # useAuth
│       ├── pages/ # 화면 단위
│       ├── styles/ # 공통 스타일
│       ├── utils/ # format.js (날짜·라벨 포맷)
│       └── assets/
├── backend/ # Node.js + Express
│ ├── src/
│ │     ├── routes/
│ │     ├── controllers/
│ │     ├── services/
│ │     ├── repositories/
│ │     ├── models/ # User, Profile, LearningHistory
│ │     ├── policies/ # levelPolicy (학습 점수·레벨 계산)
│ │     ├── middlewares/ # auth, userValidator, errorHandler
│ │     ├── jobs/ # deadlineJob (node-cron 마감 처리)
│ │     ├── constants/ # 공통 상수
│ │     ├── utils/ # response, pagination, createError, parseId
│ │     ├── config/ # DB 연결
│ │     └── app.js
│ └── db/ # schema.sql
└── docs/ # 회고(retro/)
```

## 팀원과 역할

| 이름 | 역할 | 담당 |
| --- | --- | --- |
| 김성진 | 팀장(PM) | |
| 박도영 | | |
| 김정훈 | | |
| 정우빈 | | |
| 김경렬 | | |

## 그라운드 룰

- 코어 타임: 평일 09:00 ~ 19:00 / 주말 10:00 ~ 15:00
- 연락 채널: 멋사 팀 채팅, 카카오톡 오픈채팅
- 답장 기한: 하루 이내
- 지각/결석 시 공유 방법: 멋사 팀 채팅 및 오픈채팅방에 공유 

## 화면 캡처
![이미지샘플](https://github.com/user-attachments/assets/001bb382-f506-4107-ab08-0bd872f0ec03)
(최종 발표 전 추가)
