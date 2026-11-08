// 모집 마감 스케줄러
// 매일 자정과 서버 시작 시 1회: 마감일 지난 모집 글 → 모집완료, 대기 요청 취소
const cron = require("node-cron");
const projectService = require("../services/projectService");

// 1. 마감 처리 한 번 실행
const runDeadlineJob = async () => {
    try {
        const count = await projectService.closeExpired();
        console.log(`[마감 스케줄러] 모집완료 처리 ${count}건`);
    } catch (error) {
        // 스케줄러 오류로 서버가 꺼지지 않도록 여기서 기록만 함
        console.error("[마감 스케줄러] 처리 실패", error);
    }
};

// 2. 스케줄러 시작
const startDeadlineJob = () => {
    // 서버가 꺼져 있던 동안 지난 마감도 처리되도록 시작할 때 한 번 실행
    runDeadlineJob();

    // 분 시 일 월 요일 → 매일 0시 0분 (한국 시간)
    cron.schedule("0 0 * * *", runDeadlineJob, { timezone: "Asia/Seoul" });
};

module.exports = { startDeadlineJob, runDeadlineJob };