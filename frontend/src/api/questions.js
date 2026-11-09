import client from "./client";

// 검색 조건에 맞는 질문 목록을 조회한다.
export async function getQuestions(params = {}) {
    const response = await client.get("/questions", {
        params
    });

    return response.data.data;
}

// 질문 한 개의 상세 내용을 조회한다.
export async function getQuestion(id) {
    const response = await client.get(`/questions/${id}`);

    return response.data.data;
}

// 제목과 본문으로 질문을 등록하고 생성된 질문 번호를 받는다.
export async function createQuestion(input) {
    const response = await client.post("/questions", input);
    return response.data.data;
}

export async function updateQuestion(id, input) {
    const response = await client.put(`/questions/${id}`, input);
    return response.data.data;
}

export async function deleteQuestion(id) {
    const response = await client.delete(`/questions/${id}`);
    return response.data.data;
}

// 질문 신고: 사유·상세 내용과 신고 대상 번호를 전달한다.
export async function reportQuestion(id, input) {
    const response = await client.post("/reports", {
        targetType: "QUESTION",
        targetId: id,
        reason: input.reason,
        detail: input.detail
    });
    return response.data.data;
}
