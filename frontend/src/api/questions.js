import client from "./client";

// 단순 요청 함수는 Axios 응답 전체를 반환한다.

// 검색 조건에 맞는 질문 목록을 조회한다.
export async function getQuestions(params = {}) {
    const response = await client.get("/questions", {
        params
    });

    return response;
}

// 질문 한 개의 상세 내용을 조회한다.
export async function getQuestion(id) {
    const response = await client.get(`/questions/${id}`);

    return response;
}

// 제목과 본문으로 질문을 등록하고 생성된 질문 번호를 받는다.
export async function createQuestion(input) {
    const response = await client.post("/questions", input);
    return response;
}

export async function updateQuestion(id, input) {
    const response = await client.put(`/questions/${id}`, input);
    return response;
}

export async function deleteQuestion(id) {
    const response = await client.delete(`/questions/${id}`);
    return response;
}

// 질문 신고: 사유·상세 내용과 신고 대상 번호를 전달한다.
export async function reportQuestion(id, input) {
    const response = await client.post("/reports", {
        targetType: "QUESTION",
        targetId: id,
        reason: input.reason,
        detail: input.detail
    });
    return response;
}

// 내가 이 질문을 이미 신고했는지 조회한다.
// 응답을 가공하는 함수이므로 Axios 응답 대신 신고 여부(boolean)를 반환한다.
export async function getQuestionReportStatus(id) {
    const response = await client.get("/reports/mine", {
        params: {
            targetType: "QUESTION",
            targetIds: String(id)
        }
    });

    const reportedIds = response.data.data.reportedIds;

    return reportedIds.some(
        (reportedId) => String(reportedId) === String(id)
    );
}
