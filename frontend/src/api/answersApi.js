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
