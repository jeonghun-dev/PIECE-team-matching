import client from "./client";

export async function getAnswers(questionId) {
  const response = await client.get(`/questions/${questionId}/answers`);
  return response.data.data;
}

export async function createAnswer(questionId, content) {
  const response = await client.post(`/questions/${questionId}/answers`, {
    content,
  });

  return response.data.data;
}

export async function updateAnswer(answerId, content) {
  const response = await client.put(`/answers/${answerId}`, {
    content,
  });

  return response.data.data;
}

export async function deleteAnswer(answerId) {
  await client.delete(`/answers/${answerId}`);
}

export async function acceptAnswer(answerId) {
  const response = await client.patch(`/answers/${answerId}/accept`);

  return response.data.data;
}

// 답변 신고 (신고 사유/상세 내용 전달)
export async function reportAnswer(answerId, input) {
  const response = await client.post("/reports", {
    targetType: "ANSWER",
    targetId: answerId,
    reason: input.reason,
    detail: input.detail,
  });

  return response.data.data;
}

// 내가 신고한 답변 번호 목록 (서버가 한 번에 100개까지 받아서 나눠서 요청)
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
