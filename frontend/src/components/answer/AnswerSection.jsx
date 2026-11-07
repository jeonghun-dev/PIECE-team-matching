import { useEffect, useRef, useState } from "react";
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
  const [isMutating, setIsMutating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const mutationLockRef = useRef(false);
  const scopeVersionRef = useRef(0);
  const listRequestRef = useRef(0);

  useEffect(() => {
    const scopeVersion = ++scopeVersionRef.current;
    const requestId = ++listRequestRef.current;

    // 현재 화면에서 실행한 최신 조회인지 확인
    function isCurrentRequest() {
      return (
        scopeVersionRef.current === scopeVersion &&
        listRequestRef.current === requestId
      );
    }

    async function loadAnswers() {
      setIsLoading(true);
      setErrorMessage("");
      setAnswers([]);

      try {
        const data = await getAnswers(questionId);

        if (isCurrentRequest()) {
          setAnswers(data);
        }
      } catch (error) {
        if (isCurrentRequest()) {
          setErrorMessage(
            error.response?.data?.message || "답변 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isCurrentRequest()) {
          setIsLoading(false);
        }
      }
    }

    if (!authLoading && user && questionId) {
      loadAnswers();
    }

    return () => {
      // 이전 화면과 이전 조회의 웅답을 무효화
      scopeVersionRef.current += 1;
      listRequestRef.current += 1;
    };
  }, [questionId, user, authLoading, retryCount]);

  // 답변 등록 후 최신 목록 조회
  async function handleCreateAnswer(content) {
    if (mutationLockRef.current) {
      throw new Error("다른 답변 작업이 진행 중입니다.");
    }

    mutationLockRef.current = true;
    setIsMutating(true);

    const scopeVersion = scopeVersionRef.current;
    const requestId = ++listRequestRef.current;

    function isCurrentRequest() {
      return (
        scopeVersionRef.current === scopeVersion &&
        listRequestRef.current === requestId
      );
    }

    try {
      await createAnswer(questionId, content);

      // 등록 도중 다른 질문으로 이동했다면 화면 갱신 중단
      if (!isCurrentRequest()) {
        return;
      }

      try {
        const data = await getAnswers(questionId);

        if (isCurrentRequest()) {
          setAnswers(data);
        }
      } catch {
        if (isCurrentRequest()) {
          setErrorMessage(
            "답변은 등록됐지만 목록을 불러오지 못했습니다. 아래 버튼으로 목록을 다시 불러와 주세요.",
          );
        }
      }
    } finally {
      mutationLockRef.current = false;
      setIsMutating(false);
    }
  }

  // 서버 수정 성공 후 화면에 반영

  async function handleUpdateAnswer(answerId, content) {
    if (mutationLockRef.current) {
      throw new Error("다른 답변 작업이 진행 중입니다.");
    }

    mutationLockRef.current = true;
    setIsMutating(true);

    const scopeVersion = scopeVersionRef.current;
    const requestId = ++listRequestRef.current;

    try {
      await updateAnswer(answerId, content);

      // 화면이 바뀌거나 더 최신 조회가 시작됐다면 반영하지 않음
      if (
        scopeVersionRef.current !== scopeVersion ||
        listRequestRef.current !== requestId
      ) {
        return;
      }

      setAnswers((prevAnswers) =>
        prevAnswers.map((answer) =>
          answer.id === answerId ? { ...answer, content } : answer,
        ),
      );
    } finally {
      mutationLockRef.current = false;
      setIsMutating(false);
    }
  }

  // 서버 삭제 성공 후 현재 질문 목록에서 제외
  async function handleDeleteAnswer(answerId) {
    if (mutationLockRef.current) {
      throw new Error("다른 답변 작업이 진행 중입니다.");
    }

    mutationLockRef.current = true;
    setIsMutating(true);

    const scopeVersion = scopeVersionRef.current;
    const requestId = ++listRequestRef.current;

    try {
      await deleteAnswer(answerId);

      //화면이 바뀌거나 더 최신 조회가 시작됐다면 반영하지 않음
      if (
        scopeVersionRef.current !== scopeVersion ||
        listRequestRef.current !== requestId
      ) {
        return;
      }
      setAnswers((prevAnswers) =>
        prevAnswers.filter((answer) => answer.id !== answerId),
      );
    } finally {
      mutationLockRef.current = false;
      setIsMutating(false);
    }
  }

  // 서버 채택 성공 후 답변과 질문 화면에만 반영
  async function handleAcceptAnswer(answerId) {
    if (mutationLockRef.current) {
      throw new Error("다른 답변 작업이 진행 중입니다.");
    }

    mutationLockRef.current = true;
    setIsMutating(true);

    const scopeVersion = scopeVersionRef.current;
    const requestId = ++listRequestRef.current;

    try {
      await acceptAnswer(answerId);

      // 화면이 바뀌거나 더 최신 조회가 시작됐자면 반영하지 않음

      if (
        scopeVersionRef.current !== scopeVersion ||
        listRequestRef.current !== requestId
      ) {
        return;
      }

      setAnswers((prevAnswers) =>
        prevAnswers.map((answer) => ({
          ...answer,
          isAccepted: answer.id === answerId,
        })),
      );

      onSolvedChange?.(true);
    } finally {
      mutationLockRef.current = false;
      setIsMutating(false);
    }
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
    return (
      <div>
        <p role="alert">{errorMessage}</p>

        <button
          type="button"
          className="answer-card__edit"
          disabled={isMutating}
          onClick={() => {
            if (mutationLockRef.current) {
              return;
            }

            setRetryCount((count) => count + 1);
          }}
        >
          목록 다시 불러오기
        </button>
      </div>
    );
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
        isMutating={isMutating}
        onUpdateAnswer={handleUpdateAnswer}
        onDeleteAnswer={handleDeleteAnswer}
        onAcceptAnswer={handleAcceptAnswer}
      />
      <AnswerForm onSubmit={handleCreateAnswer} isSubmitting={isMutating} />
    </div>
  );
}
