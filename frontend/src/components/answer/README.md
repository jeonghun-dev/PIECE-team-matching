# 답변 영역 연결 안내

## 담당

- 답변 영역: 김정훈
- 질문 상세 화면: 정우빈

## 컴포넌트 역할

- AnswerSection: 답변 API 호출, 목록 상태, 로딩·오류 처리
- AnswerList: 답변 목록, 수정·삭제·채택 버튼
- AnswerForm: 답변 작성 입력창

## 질문 상세 화면에서 사용하기

아래 예시는 question이 질문 상세 API 응답이고,
setQuestion이 해당 상태를 변경하는 함수인 경우입니다.

질문 조회가 완료된 뒤 AnswerSection을 표시합니다.

```jsx
import AnswerSection from "../../components/answer/AnswerSection";
```

```jsx
{
  question && (
    <AnswerSection
      key={question.id}
      questionId={question.id}
      questionAuthorId={question.authorId}
      isSolved={question.isSolved}
      onSolvedChange={(isSolved) => {
        setQuestion((prev) => (prev ? { ...prev, isSolved } : prev));
      }}
    />
  );
}
```

- key: 다른 질문으로 이동할 때 답변 영역 상태를 초기화합니다.
- questionId: 질문 번호
- questionAuthorId: 질문 작성자 번호
- isSolved: 해결 여부. true 또는 false로 전달합니다.
- onSolvedChange: 채택 성공 후 질문 화면의 해결 표시를 갱신합니다.
  이 함수에는 화면 상태 변경만 넣고, 별도의 저장 API는 호출하지 않습니다.

## 인증

- 로그인 정보는 공통 useAuth에서 가져옵니다.
- JWT는 공통 Axios client가 요청에 첨부합니다.
- 사용자 번호를 요청 본문에 넣지 않습니다.
- 최종 작성자 권한 검사는 백엔드에서 수행합니다.

## 동작 규칙

- 본인 답변만 수정·삭제 버튼을 표시합니다.
- 채택된 답변의 삭제 버튼을 숨깁니다.
- 미해결 질문의 작성자에게만 채택 버튼을 표시합니다.
- 서버 요청이 성공한 뒤 화면에 반영합니다.
- 등록·수정 실패 시 입력 내용을 유지합니다.

## 검증 상태

- 임시 데이터 미리보기에서 작성·수정·삭제·채택 동작 확인
- 답변 관련 코드 검사 통과
- 실제 로그인 및 질문 상세 화면과 연결한 통합 테스트는 예정

## 공통 스타일

colors.css와 tokens.css를 팀 공통 기준으로 사용합니다.
두 파일은 main.jsx에서 한 번만 불러옵니다.
