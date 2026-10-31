# BEJV27-1st-6TEAM

# (프로젝트 이름)

> (한 줄 소개)

## 프로젝트 소개

- 타깃 사용자:
- 해결하려는 문제:
- 차별화 기능:

## 주요 기능

- 
- 

## 기술 스택

| 구분 | 기술 | 버전 |
| --- | --- | --- |
| Frontend | React | 19.3.1 |
| | Vite | 8.3.5 |
| | react-router-dom | 7.18.5 |
| | axios | 1.21.0 |
| | ESLint | 10.13.0 |
| Backend | Node.js | 24.21.0 |
| | Express | 5.3.0 |
| | mysql2 | 3.24.6 |
| | bcrypt | 6.0.0 |
| | jsonwebtoken | 9.0.3 |
| | dotenv | 18.0.9 |
| | cors | 2.8.6 |
| | nodemon (개발용) | 3.1.14 |
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

# 2. 백엔드
cd backend
cp .env.example .env   # .env에 DB 비밀번호, JWT_SECRET 채우기
npm install
npm run dev

# 3. 프론트엔드 (새 터미널)
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## 폴더 구조

```
BEJV27-1st-6TEAM/
├── frontend/          # React (Vite)
│   └── src/
│       ├── api/         # axios 인스턴스, API 함수
│       ├── components/  # 재사용 컴포넌트
│       ├── pages/       # 화면 단위
│       └── hooks/
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── config/      # DB 연결
│   │   └── app.js
│   └── db/              # schema.sql
└── docs/              # 산출물, 회고(retro/)
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
- 연락 채널: 멋사 팀 채팅
- 답장 기한: 
- 지각/결석 시 공유 방법: 멋사 팀 채팅에 공유 

## 화면 캡처

(최종 발표 전 추가)