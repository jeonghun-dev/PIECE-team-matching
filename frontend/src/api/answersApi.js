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
