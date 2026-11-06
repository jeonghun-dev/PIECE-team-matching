import { useEffect, useState } from "react";
import {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
} from "../../api/answerApi";
import { useAuth } from "../../hooks/useAuth";
import AnswerList from "./AnswerList";
import AnswerForm from "./AnswerForm";

export default function AnswerSection({
  questionId,
  questionAuthorId = null,
  isSolved = true,
  onSolvedChange,
}) {
  const { user, loading: authLoading } = useAuth();

  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 로그인 정보와 질문 번호가 준비되면 조회
    if (authLoading || !user || !questionId) {
      return;
    }

    let cancelled = false;

    async function loadAnswers() {
      setIsLoading(true);
      setErrorMessage("");
      setAnswers([]);

      try {
        const data = await getAnswers(questionId);

        if (!cancelled) {
          setAnswers(data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error.response?.data?.message || "답변 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadAnswers();

    // 다른 질문으로 이동하면 이전 요청 결과를 반영하지 않음
    return () => {
      cancelled = true;
    };
  }, [questionId, user, authLoading]);

  // 답변 등록 후 최신 목록 조회
  async function handleCreateAnswer(content) {
    await createAnswer(questionId, content);

    try {
      const data = await getAnswers(questionId);
      setAnswers(data);
    } catch {
      window.alert(
        "답변은 등록됐지만 목록을 새로 불러오지 못했습니다. 다시 등록하지 말고 페이지를 새로고침 해주세요.",
      );
    }
  }

  // 서버 수정 성공 후 화면에 반영
  async function handleUpdateAnswer(answerId, content) {
    await updateAnswer(answerId, content);

    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) =>
        answer.id === answerId ? { ...answer, content } : answer,
      ),
    );
  }

  // 서버 삭제 성공 후 목록에서 제외
  async function handleDeleteAnswer(answerId) {
    await deleteAnswer(answerId);

    setAnswers((prevAnswers) =>
      prevAnswers.filter((answer) => answer.id !== answerId),
    );
  }

  // 서버 채택 성공 후 답변과 질문 화면에 반영
  async function handleAcceptAnswer(answerId) {
    await acceptAnswer(answerId);

    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) => ({
        ...answer,
        isAccepted: answer.id === answerId,
      })),
    );

    // 부모 화면에 질문이 해결됐음을 알림
    onSolvedChange?.(true);
  }

  if (authLoading) {
    return <p>로그인 정보를 확인하고 있습니다.</p>;
  }

  if (!user) {
    return <p>답변을 보려면 로그인해 주세요.</p>;
  }

  if (!questionId) {
    return <p>질문 번호가 필요합니다.</p>;
  }

  if (isLoading) {
    return <p>답변을 불러오고 있습니다.</p>;
  }

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-5)",
      }}
    >
      <AnswerList
        answers={answers}
        currentUserId={user.id}
        questionAuthorId={questionAuthorId}
        isSolved={isSolved || answers.some((answer) => answer.isAccepted)}
        onUpdateAnswer={handleUpdateAnswer}
        onDeleteAnswer={handleDeleteAnswer}
        onAcceptAnswer={handleAcceptAnswer}
      />
      <AnswerForm onSubmit={handleCreateAnswer} />
    </div>
  );
}
