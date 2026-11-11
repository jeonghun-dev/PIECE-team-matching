import client from "./client";

// 다른 API 파일과 같게 axios 응답을 그대로 반환 (화면에서 response.data.data 사용)
export const getAnswers = (questionId) => {
  return client.get(`/questions/${questionId}/answers`);
};

export const createAnswer = (questionId, content) => {
  return client.post(`/questions/${questionId}/answers`, { content });
};

export const updateAnswer = (answerId, content) => {
  return client.put(`/answers/${answerId}`, { content });
};

export const deleteAnswer = (answerId) => {
  return client.delete(`/answers/${answerId}`);
};

export const acceptAnswer = (answerId) => {
  return client.patch(`/answers/${answerId}/accept`);
};

// 답변 신고 (신고 사유/상세 내용 전달)
export const reportAnswer = (answerId, input) => {
  return client.post("/reports", {
    targetType: "ANSWER",
    targetId: answerId,
    reason: input.reason,
    detail: input.detail,
  });
};

// 내가 신고한 답변 번호 목록 (가공 함수 - axios 응답이 아니라 숫자 배열을 반환)
// 서버가 한 번에 100개까지 받아서, 여러 번 나눠 요청한 결과를 합쳐 [1, 5, 9] 형태로 돌려줌
export async function getMyReportedAnswerIds(answerIds) {
  const chunks = [];

  for (let index = 0; index < answerIds.length; index += 100) {
    chunks.push(answerIds.slice(index, index + 100));
  }

  const responses = await Promise.all(
    chunks.map((ids) =>
      client.get("/reports/mine", {
        params: { targetType: "ANSWER", targetIds: ids.join(",") },
      }),
    ),
  );

  return responses.flatMap((response) =>
    response.data.data.reportedIds.map(Number),
  );
}
