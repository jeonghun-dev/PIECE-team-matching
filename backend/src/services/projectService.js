// 모집 글 업무 규칙 계층

const{getPagination, toPageResponse} = require("../utils/pagination");
const pool = require("../config/db");
const projectRepository = require("../repositories/projectRepository");
const { LEVEL, PROGRESS_MODE, ACTIVE_TIME, PROJECT_STATUS } = require("../constants");

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

// URL의 모집 글 번호 검사 (1 이상의 정수)
const parseProjectId = (id) => {
    const projectId = Number(id);
    if (!Number.isSafeInteger(projectId) || projectId < 1) {
        throw createError(400, "모집 글 번호가 올바르지 않습니다.");
    }
    return projectId;
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

// 모집 글 수정
// actor: 로그인한 사용자 (req.user), id: URL의 모집 글 번호, input: 요청 본문
const edit = async (actor, id, input) => {

    // 로그인 확인
    if (!actor) {
        throw createError(401, "로그인이 필요합니다.");
    }

    // DB 없이 할 수 있는 검사는 트랜잭션 전에
    const projectId = parseProjectId(id);
    const project = validateProjectInput(input);

    const tx = await pool.getConnection();
    try {
        await tx.beginTransaction();

        // 글 존재 여부 (잠금)
        const found = await projectRepository.findByIdForUpdate(tx, projectId);
        if (!found) {
            throw createError(404, "모집 글을 찾을 수 없습니다.");
        }

        // 작성자 본인만
        if (Number(found.authorId) !== Number(actor.id)) {
            throw createError(403, "작성자만 수정할 수 있습니다.");
        }

        // 모집 완료된 글은 수정 불가
        if (found.status === PROJECT_STATUS.CLOSED) {
            throw createError(409, "모집이 완료된 글은 수정할 수 없습니다.");
        }

        // 정원은 현재 팀원 수보다 작게 못 바꿈
        const memberCount = await projectRepository.countMembers(tx, projectId);
        if (project.capacity < memberCount) {
            throw createError(409, `모집 정원은 현재 팀원 수(${memberCount}명)보다 작을 수 없습니다.`);
        }

        await projectRepository.update(tx, projectId, project);

        // 정원이 다 찼으면 모집 완료 하고 대기 요청 취소
        if (project.capacity === memberCount) {
            await projectRepository.close(tx, projectId);
            await projectRepository.cancelPendingRequests(tx, projectId);
        }

        await tx.commit();
        return { id: projectId };
    } catch (error) {
        await tx.rollback();
        throw error;
    } finally {
        tx.release();
    }
};

// 모집 글 삭제 (소프트 삭제 + 대기 요청 취소를 한 트랜잭션으로)
const remove = async (actor, id) => {

    // 로그인 확인
    if (!actor) {
        throw createError(401, "로그인이 필요합니다.");
    }

    const projectId = parseProjectId(id);

    const tx = await pool.getConnection();
    try {
        await tx.beginTransaction();

        // 글 존재 여부 (잠금)
        const found = await projectRepository.findByIdForUpdate(tx, projectId);
        if (!found) {
            throw createError(404, "모집 글을 찾을 수 없습니다.");
        }

        // 작성자 본인만
        if (Number(found.authorId) !== Number(actor.id)) {
            throw createError(403, "작성자만 삭제할 수 있습니다.");
        }

        // 글 삭제와 대기 요청 취소는 같이 성공하거나 같이 실패
        await projectRepository.softDelete(tx, projectId);
        await projectRepository.cancelPendingRequests(tx, projectId);

        await tx.commit();
        return { id: projectId };
    } catch (error) {
        await tx.rollback();
        throw error;
    } finally {
        tx.release();
    }
};

// 모집 글 목록을 페이지 단위로 조회한다.
const list = async (query) => {
    const { level, status, sort="latest"} = query;

    if (
        level !== undefined &&
        !Object.values(LEVEL).includes(level)
    ) {
        throw createError(400, "학습 레벨이 올바르지 않습니다.");
    }

    if (
        status !== undefined &&
        !Object.values(PROJECT_STATUS).includes(status)
    ) {
        throw createError(400, "모집 상태가 올바르지 않습니다.");
    }


// 정렬 기준 검사 — 여기에 추가
    if (!["latest", "views", "questions"].includes(sort)) {
        throw createError(400, "정렬 기준이 올바르지 않습니다.");
    }




    // 질문 검색과 동일하게 검색어는 공백 제거 후 최대 100자로 제한한다.
    if (query.keyword !== undefined && typeof query.keyword !== "string") {
        throw createError(400, "검색어는 문자열이어야 합니다.");
    }
    const keyword = (query.keyword ?? "").trim();
    if (keyword.length > 100) {
        throw createError(400, "검색어는 100자 이하여야 합니다.");
    }

    const paging = getPagination(query);

    if (
        !Number.isSafeInteger(paging.page) ||
        !Number.isSafeInteger(paging.offset)
    ) {
        throw createError(400, "페이지 범위가 너무 큽니다.");
    }

    const totalCount = await projectRepository.count(
        keyword,
        level,
        status
    );

    const items = await projectRepository.findPage(
        paging.limit,
        paging.offset,
        keyword,
        level,
        status,
        sort
    );

    return toPageResponse(items, totalCount, paging);
};

// 모집 글 상세와 현재 사용자의 지원·소속 상태를 조회한다.
const detail = async (actor, id) => {
    const projectId = parseProjectId(id);

    const affectedRows =
        await projectRepository.increaseViewCount(projectId);

    if (affectedRows === 0) {
        throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    const project = await projectRepository.findById(projectId);

    if (!project) {
        throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    let isMember = false;
    let hasApplied = false;

    if (actor && actor.id) {
        isMember = await projectRepository.existsMember(
            projectId,
            actor.id
        );

        hasApplied = await projectRepository.existsPendingApplication(
            projectId,
            actor.id
        );
    }

    return {
        ...project,
        isMember,
        hasApplied
    };
};

// 마감일이 지난 모집 글을 모집완료로 바꾸고 대기 요청 취소
// 마감 스케줄러가 매일 자정과 서버 시작 시 호출
const closeExpired = async () => {
    const today = getToday();

    const tx = await pool.getConnection();
    try {
        await tx.beginTransaction();

        // 대상 글을 먼저 잠가서 수락·수정 처리와 겹치지 않게 함
        const projectIds = await projectRepository.findExpiredForUpdate(tx, today);

        for (const projectId of projectIds) {
            await projectRepository.close(tx, projectId);
            await projectRepository.cancelPendingRequests(tx, projectId);
        }

        await tx.commit();
        return projectIds.length;
    } catch (error) {
        await tx.rollback();
        throw error;
    } finally {
        tx.release();
    }
};

module.exports = { 
    publish, 
    edit, 
    remove,
    list,
    detail,
    closeExpired
 };
