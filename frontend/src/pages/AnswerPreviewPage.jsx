import { useState } from "react";
import AnswerList from "../components/answer/AnswerList";
import AnswerForm from "../components/answer/AnswerForm";

const sampleAnswers = [
  {
    id: 1,
    authorId: 1,
    authorNickname: "테스트팀장",
    authorLevel: "BUILDER",
    authorScore: 6,
    content: "mysql2의 createPool로 연결 풀을 만들고 사용하면 됩니다.",
    isAccepted: false,
  },
  {
    id: 2,
    authorId: 2,
    authorNickname: "테스트팀원",
    authorLevel: "STARTER",
    authorScore: 1,
    content: "설명 감사합니다.\n연결 풀을 사용하는 방법으로 적용해 보겠습니다.",
    isAccepted: false,
  },
];

export default function AnswerPreviewPage() {
  const [answers, setAnswers] = useState(sampleAnswers);
  const [isSolved, setIsSolved] = useState(false);

  // 새로운 답변 등록
  function handleAnswerSubmit(content) {
    const newAnswer = {
      id: Date.now(),
      authorId: 2,
      authorNickname: "테스트사용자",
      authorLevel: "STARTER",
      authorScore: 0,
      content: content,
      isAccepted: false,
    };

    setAnswers((prevAnswers) => [...prevAnswers, newAnswer]);
  }

  // 기존 답변 수정
  function handleUpdateAnswer(answerId, content) {
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) =>
        answer.id === answerId ? { ...answer, content } : answer,
      ),
    );
  }

  function handleDeleteAnswer(answerId) {
    setAnswers((prevAnswers) =>
      prevAnswers.filter((answer) => answer.id !== answerId),
    );
  }

  // 미리보기에서 답변 채택
  function handleAcceptAnswer(answerId) {
    if (isSolved) {
      return;
    }

    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) => ({
        ...answer,
        isAccepted: answer.id === answerId,
      })),
    );

    setIsSolved(true);
  }

  return (
    <main
      style={{
        padding: "32px 24px",
        minHeight: "100vh",
        boxSizing: "border-box",
        backgroundColor: "var(--color-page)",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AnswerList
          answers={answers}
          currentUserId={2}
          questionAuthorId={2}
          isSolved={isSolved}
          onUpdateAnswer={handleUpdateAnswer}
          onDeleteAnswer={handleDeleteAnswer}
          onAcceptAnswer={handleAcceptAnswer}
        />

        <div style={{ marginTop: "24px" }}>
          <AnswerForm onSubmit={handleAnswerSubmit} />
        </div>
      </div>
    </main>
  );
}
