# PIECE — 내 담당 기능 정리 (김정훈)

> 멋쟁이사자처럼 백엔드 스쿨 **DevMates(6팀)** 팀 프로젝트의 원본 저장소(private)를 커밋 기록과 함께 옮겨 온 저장소입니다.
> 저는 **참여 요청 · 답변/채택 · 신고/관리자** 기능의 백엔드 API와 관리자 화면을 맡았습니다.
> 프로젝트 전체 소개와 실행 방법은 아래 팀 README에 있습니다.

| 항목 | 내용 |
| --- | --- |
| 기간 | 2026.10.26 – 2026.11.16 (약 3주) |
| 팀 | DevMates · 개발자 5명 |
| 내 기여 | 커밋 69 · PR 23 |
| 시연 영상 | https://youtu.be/QDdRM-YoYUc?si=Kmb3dOGQLF8MsTna |
| 포트폴리오 | [링크 추가] |

## 내가 맡은 부분

### 1. 참여 요청 · 팀원 관리
- 마지막 한 자리에 두 수락이 동시에 들어와도 정원을 넘지 않도록, 수락 전체를 트랜잭션으로 묶고 `SELECT … FOR UPDATE`로 모집 글 → 요청 순서로 잠근 뒤 정원 확인
- 정원이 차면 같은 트랜잭션에서 모집 마감 + 남은 대기 요청 정리

### 2. 답변 · 채택
- 채택을 조건부 `UPDATE` 한 문장으로 처리해 한 질문에 답변이 두 개 채택되는 경쟁 상태 방지 (바뀐 행이 0이면 409)
- 채택된 답변은 작성자도 삭제 불가

### 3. 신고 · 관리자
- 신고를 대상별로 `GROUP BY`해 한 줄로 보여 주고, 대상 단위로 한 번에 처리
- 중복 신고는 `UNIQUE(신고자, 대상)` 제약으로 막고 409 응답
- 관리자가 채택 답변을 지우면 답변 삭제 · 채택 해제 · 질문 미해결 복귀를 한 트랜잭션으로 처리
- 정지 회원은 로그인과 기존 토큰 모두 403 (요청마다 DB 상태 확인)

### 팀 공통
- 공통 유틸(`sendSuccess`, `createError`, `parseId`) 도입과 응답 형식 통일 리팩터링

## 트러블슈팅

| PR | 문제 | 해결 |
| --- | --- | --- |
| #89 | 관리자 신고 목록의 ‘보기’가 404 | 신고 조회에 LEFT JOIN으로 projectId를 내려 모집 글 상세로 이동 |
| #74 | 새로고침하면 같은 글을 다시 신고 가능 | 내 신고 조회 API 추가, 409를 ‘신고됨’으로 표시 |
| #67 | 응답 대기 중 다른 글로 이동하면 상태가 섞임 | 마운트 여부 ref + `key={id}`로 컴포넌트 새로 그리기 |

---

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


### 1. 저장소 클론
```
git clone https://github.com/likelion-backendschool-10th/BEJV27-1st-6TEAM.git
cd BEJV27-1st-6TEAM
```
### 2. DB 생성 (MySQL 기준)
MySQL Workbench에서 아래 순서대로 실행합니다. (File → Open SQL Script → 실행)

| 순서 | 파일 | 설명 |
| --- | --- | --- |
| 1 | backend/db/schema.sql | piece_db 데이터베이스와 테이블 7개 생성 |
| 2 | backend/db/newSeed.sql | 테스트 데이터 입력 (기존 데이터를 비우고 다시 넣음) |

터미널(MySQL CLI)로 실행할 경우:
```
mysql -u root -p < backend/db/schema.sql
mysql -u root -p < backend/db/newSeed.sql
```

테스트 계정 (공통 비밀번호 test1234!)
| 이메일 | 권한 |
| --- | --- |
| leader@example.com | 일반 회원 (모집자) |
| member@example.com | 일반 회원 (팀원) |
| applicant@example.com | 일반 회원 (지원자) |
| admin@example.com | 관리자 |

### 3. 백엔드
```
cd backend
cp .env.example .env   # .env에 DB 비밀번호, JWT_SECRET 채우기
npm install
npm run dev
```

### 4. 프론트엔드 (새 터미널)
```
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

| 이름 | 역할 | FE 담당 | BE 담당 |
| --- | --- | --- | --- |
| 김성진 | 팀장 (PM) | • 공통 레이아웃 및 상단 네비게이션<br>• React Router 설정 및 라우트 보호<br>• Axios 인스턴스(인터셉터, 에러 처리)<br>• 모집 글 작성/수정 폼, 마이페이지 | • 공통 응답·에러 포맷 정의<br>• 모집 글 CRUD API (작성자 검증, 수정 제한)<br>• 마이페이지 조회 API<br>• 모집 마감 스케줄러 (node-cron 배치) |
| 박도영 | 팀원 | • 로그인 / 회원가입 UI 및 유효성 검증<br>• 회원가입 완료 화면 (점수/레벨 표시)<br>• 마이페이지 기술 프로필 & 학습 이력 수정 | • JWT 인증 미들웨어 & bcrypt 암호화<br>• 회원가입 / 로그인 / 프로필 수정 API<br>• 학습 점수 산정 및 3단계 레벨 자동 갱신 로직<br>• 사용자 프로필 조회 API |
| 정우빈 | 팀원 | • 모집 게시판 목록 & 상세 UI<br>• 질문 게시판 목록 & 상세 UI<br>• 질문 작성 / 수정 / 삭제 폼<br>• 다중 필터, 검색, 정렬 및 페이지네이션 | • 모집 글 목록 & 상세 조회 API (조회수 카운트)<br>• 질문 CRUD API (작성자 권한 검증)<br>• 게시글 다중 조건 검색·필터·페이징 API<br>• 모집 글 내 질문 등록/조회 API |
| 김경렬 | 팀원 | • 메인 추천 화면 (프로젝트/팀원 추천, 블라인드)<br>• 팀원 찾기 및 팀원 상세 프로필 UI<br>• 프로젝트 초대 모달<br>• 요청함(받은/보낸) 및 상단 알림 배지 UI | • 레벨 기반 맞춤 프로젝트 & 팀원 추천 API<br>• 팀원 검색 & 다중 필터링 API<br>• 프로젝트 초대 발송 / 수락 / 거절 / 취소 API<br>• 요청함 조회 & 알림 읽음 처리 API |
| 김정훈 | 팀원 | • 공통 답변 목록 & 에디터 컴포넌트<br>• 답변 채택 UI (질문자 전용)<br>• 프로젝트 지원 신청 UI 및 지원자·팀원 관리 화면<br>• 관리자 페이지(회원/게시글 관리) 및 신고 모달 | • 답변 CRUD & 답변 채택 트랜잭션 API<br>• 프로젝트 지원 및 수락/거절 API (정원 초과 방지)<br>• 팀원 제외 API (모집 중 검증)<br>• 관리자 API (회원 정지, 신고 접수/처리, 글 강제 삭제)<br>• DB 스키마 설계 및 무결성 관리 |

## 그라운드 룰

- 코어 타임: 평일 09:00 ~ 19:00 / 주말 10:00 ~ 15:00
- 연락 채널: 멋사 팀 채팅, 카카오톡 오픈채팅
- 답장 기한: 하루 이내
- 지각/결석 시 공유 방법: 멋사 팀 채팅 및 오픈채팅방에 공유 

## 화면 캡처
![메인](https://private-user-images.githubusercontent.com/48229733/703261545-d3526e87-614b-41ed-9e6a-6a6a3523d08d.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njc0MjEsIm5iZiI6MTc5NDQ2NzEyMSwicGF0aCI6Ii80ODIyOTczMy83MDMyNjE1NDUtZDM1MjZlODctNjE0Yi00MWVkLTllNmEtNmE2YTM1MjNkMDhkLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MDUyMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTAzMzY5MTQ0OWZkNDg0ZGYxODRhYzI3M2Y5NWEwNzI3NWNkNWE5NDM1YjI3Y2ZiZmJjNDcxYjM4YmQzOTkzNzQmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.qg-F9gL8hGIjRw4hDM38PrLOTzyQ4NRy8AJsCsvvF7c)

![로그인](https://private-user-images.githubusercontent.com/48229733/703265285-6e3023e3-6a65-47db-9ff9-16db91f5d131.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njc2MjgsIm5iZiI6MTc5NDQ2NzMyOCwicGF0aCI6Ii80ODIyOTczMy83MDMyNjUyODUtNmUzMDIzZTMtNmE2NS00N2RiLTlmZjktMTZkYjkxZjVkMTMxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MDg0OFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTY2NzkwN2YwNmNiOGEyZGVmMDllMzYxMWRiMzdhNjdmYWJhZDNmZWVkN2E3ODg3NTI1Yjk0MGZhOTA0OWYyNjgmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.ZfEvyg02uXJ2O3fM2kmh7RilJPle2xSJjhbCIod62n0)

![회원가입](https://private-user-images.githubusercontent.com/48229733/703265509-0215aa16-3ac3-42ab-bb75-1ebc1e68506e.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njc2MjgsIm5iZiI6MTc5NDQ2NzMyOCwicGF0aCI6Ii80ODIyOTczMy83MDMyNjU1MDktMDIxNWFhMTYtM2FjMy00MmFiLWJiNzUtMWViYzFlNjg1MDZlLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MDg0OFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWY0ZmFiODhhYTIwMzVhYzA1ZmEyNDM1MjZmYTljODYyM2U5ZmQyNzFjOWVkMzFiOGU5Y2E4NjlkNTc0NWQ5OGEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.-BKJrVQyfYt305nzgSu0DSrQSIh4ruUZ9FKJh3HX-i4)

![가입완료](https://private-user-images.githubusercontent.com/48229733/703265703-bfac8e07-b900-4f86-b11e-68d1dd6ee958.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njc2MjgsIm5iZiI6MTc5NDQ2NzMyOCwicGF0aCI6Ii80ODIyOTczMy83MDMyNjU3MDMtYmZhYzhlMDctYjkwMC00Zjg2LWIxMWUtNjhkMWRkNmVlOTU4LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MDg0OFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTI2YzBlNGIzMTEwYjI0ZGJmZjJhNjExZDJjNGJmNTQ2OGIxMzg3NDNjN2U2M2VhYWM4ZTdhMGNjMzZhYTcxMTImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.4ptCQ0tV-gwpo90pDayj0cAEnJPoffD9C6GxK3cB7Tw)

![모집글전체](https://private-user-images.githubusercontent.com/48229733/703265839-4b046336-e4a9-458e-98d6-0f470a1ba86d.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0MDEsIm5iZiI6MTc5NDQ2ODEwMSwicGF0aCI6Ii80ODIyOTczMy83MDMyNjU4MzktNGIwNDYzMzYtZTRhOS00NThlLTk4ZDYtMGY0NzBhMWJhODZkLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjE0MVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTIzZTFlZDdmZDJlZjcyNmM2OGM3YjQxNGM0Yzg4YzIyMzk2MzhhZWYxZjdiY2VkZjU5MDU3ZjRkOTZiOTkzNTkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.y7kfRZPecQJL9A3x7tckJ0A4kBICTXzZ4OZ2xGr4tu8)

![모집글작성](https://private-user-images.githubusercontent.com/48229733/703265864-a78cd7df-66a9-46ad-abc3-e0300646ae02.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0NjIsIm5iZiI6MTc5NDQ2ODE2MiwicGF0aCI6Ii80ODIyOTczMy83MDMyNjU4NjQtYTc4Y2Q3ZGYtNjZhOS00NmFkLWFiYzMtZTAzMDA2NDZhZTAyLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjI0MlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWE5NTlkNWRhYmZmOGZkNzVmMjM4NjA3NWY2NGFjMmNhZGZmNGNmOTQ0NGM3OTRmNDQ4NDQ5OTI3ODdmYTg5YTQmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.Dyail2c3GHomRpYBwo7qAKNy30poRi-fSNMNx6qIXFc)

![모집글상세](https://private-user-images.githubusercontent.com/48229733/703265975-1a508732-4d5f-4cf9-acaf-d8cd1e6ee397.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0NjIsIm5iZiI6MTc5NDQ2ODE2MiwicGF0aCI6Ii80ODIyOTczMy83MDMyNjU5NzUtMWE1MDg3MzItNGQ1Zi00Y2Y5LWFjYWYtZDhjZDFlNmVlMzk3LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjI0MlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWMxN2U0N2FjZWE2YjBjNDc5MTZmNDc4ZTFjOGMxOGFmZjMxNmNlNGYwYzdhZTRjNzc0MjEyNTMzMDI5NzI5MGImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.PAeVINjh-j4jIqQIe26nyTr06ixTDrGRllMBJuOE9M4)

![팀원관리](https://private-user-images.githubusercontent.com/48229733/703266105-4e1bea3c-be51-40f9-ab35-0cd73172a233.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0NjIsIm5iZiI6MTc5NDQ2ODE2MiwicGF0aCI6Ii80ODIyOTczMy83MDMyNjYxMDUtNGUxYmVhM2MtYmU1MS00MGY5LWFiMzUtMGNkNzMxNzJhMjMzLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjI0MlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTc4ZWUyOWI2Zjc0N2IxYzJlNjk3NTU1MzdmNTdjNzhjZTc2ZmNjNzJhNDIwMDU3YzYyOWExMjJiMjMwMjAwYzcmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.ho8pjjKae2CdpxFyeOnAEh8vHfmiV3a3YtGBQ3FoF2k)

![팀원찾기](https://private-user-images.githubusercontent.com/48229733/703266202-51898b2f-373c-43c3-bd6d-e2179b61f14b.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0NjIsIm5iZiI6MTc5NDQ2ODE2MiwicGF0aCI6Ii80ODIyOTczMy83MDMyNjYyMDItNTE4OThiMmYtMzczYy00M2MzLWJkNmQtZTIxNzliNjFmMTRiLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjI0MlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWI3NTJjZTI2Yjk1YzI4MTkwOThkZmQxYzg3YzJkMDhmYmI5MWY2ZWZlNTJkNzMwNWY0YjM5YTZkY2E3NjgyOGUmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.12WadkN0TYA3esylAJZk9dNuC8gMCoZvtA80BtyYwAQ)

![프로젝트초대](https://private-user-images.githubusercontent.com/48229733/703277878-a65a987a-4106-4be9-88a6-9391a5fd49d1.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTQ0Njg0NjIsIm5iZiI6MTc5NDQ2ODE2MiwicGF0aCI6Ii80ODIyOTczMy83MDMyNzc4NzgtYTY1YTk4N2EtNDEwNi00YmU5LTg4YTYtOTM5MWE1ZmQ0OWQxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjExMTIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYxMTEyVDA3MjI0MlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTMxNWU0YjgwMDAwNjU2MzY0OGZiNjA2MjI2ZDRlMDk3Y2Q2MTExNTdiNDQ1ZTA0NjgxMjZhNmJlNTAwMTBjYmMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.LkMQ2f2-qdzGykuPjzvxm2YyYYtNeoIlk8mV-qkkUJM)
