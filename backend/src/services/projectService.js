// 모집 글 업무 규칙 계층

const pool = require("../config/db");
const projectRepository = require("../repositories/projectRepository");
const { LEVEL, PROGRESS_MODE, ACTIVE_TIME } = require("../constants");

// 상태 코드와 메시지를 담은 에러 만들기
const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// 오늘 날짜 / 한국 시간 기준
const getToday = () => {
    return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

// 모집 글 입력값 검사
const validateProjectInput = (input) => {
    const { title, content, meetingMethod, targetLevel, capacity, progressMode, activeTimes, deadline } = input;

    // 프로젝트 명 필수, 최대 100자
    if (!title || title.trim() === "") {
        throw createError(400, "프로젝트 명을 입력해 주세요.");
    }
    if (title.trim().length > 100) {
        throw createError(400, "프로젝트 명은 100자 이하로 입력해 주세요.");
    }

    // 소개·회의 방식 필수, 최대 2000자
    if (!content || content.trim() === "") {
        throw createError(400, "프로젝트 소개를 입력해 주세요.");
    }
    if (content.length > 2000) {
        throw createError(400, "프로젝트 소개는 2000자 이하로 입력해 주세요.");
    }
    if (!meetingMethod || meetingMethod.trim() === "") {
        throw createError(400, "회의 진행 및 모임 방식을 입력해 주세요.");
    }
    if (meetingMethod.length > 2000) {
        throw createError(400, "회의 진행 및 모임 방식은 2000자 이하로 입력해 주세요.");
    }

    // 목표 학습 수준 정해진 값만
    if (!Object.values(LEVEL).includes(targetLevel)) {
        throw createError(400, "목표 학습 수준이 올바르지 않습니다.");
    }
    // 작성자 포함 2~5명 정수
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap < 2 || cap > 5) {
        throw createError(400, "모집 정원은 작성자 포함 2~5명입니다.");
    }

    // 진행 방식 정해진 값만
    if (!Object.values(PROGRESS_MODE).includes(progressMode)) {
        throw createError(400, "진행 방식이 올바르지 않습니다.");
    }

    // 주요 활동 시간 정해진 값만, 중복 없이
    if (!Array.isArray(activeTimes) || activeTimes.length === 0) {
        throw createError(400, "주요 활동 시간을 1개 이상 선택해 주세요.");
    }
    const validTimes = Object.values(ACTIVE_TIME);
    if (!activeTimes.every((time) => validTimes.includes(time))) {
        throw createError(400, "주요 활동 시간이 올바르지 않습니다.");
    }
    if (new Set(activeTimes).size !== activeTimes.length) {
        throw createError(400, "주요 활동 시간이 중복되었습니다.");
    }

    // 'YYYY-MM-DD' 형식, 실제 있는 날짜, 오늘 이후
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline || "")) {
        throw createError(400, "마감일 형식이 올바르지 않습니다. (YYYY-MM-DD)");
    }
    const date = new Date(deadline);
    if (isNaN(date) || date.toISOString().slice(0, 10) !== deadline) {
        throw createError(400, "존재하지 않는 날짜입니다.");
    }
    if (deadline < getToday()) {
        throw createError(400, "마감일은 오늘 이후로 선택해 주세요.");
    }

    // 검사를 통과 하면 DB에 넣을 모양으로 정리
    return {
        title: title.trim(),
        content,
        meetingMethod,
        targetLevel,
        capacity: cap,
        progressMode,
        activeTimes: activeTimes.join(","), // SET 컬럼용 'A,B' 문자열
        deadline,
    };
};

// 모집 글 등록
// actor: 로그인한 사용자 (req.user), input: 요청 본문
const publish = async (actor, input) => {
    
    // 로그인 확인
    if (!actor) {
        throw createError(401, "로그인이 필요합니다.");
    }

    const project = validateProjectInput(input);
    project.authorId = actor.id;

    const tx = await pool.getConnection();
    try {
        await tx.beginTransaction();
        const projectId = await projectRepository.save(tx, project);
        await tx.commit();
        return { id: projectId };
    } catch (error) {
        await tx.rollback();
        throw error;
    } finally {
        tx.release();
    }
};

module.exports = { publish };