// 모집 글 작성/수정
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createProject, getProject, updateProject } from "../../api/projects";
import { useAuth } from "../../hooks/useAuth";
import { LEVEL_OPTIONS, PROGRESS_MODE_OPTIONS, ACTIVE_TIME_OPTIONS, PROJECT_STATUS } from "../../constants";
import "./ProjectFormPage.css";

// 모집 정원 범위 
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 5;

// 처음 입력값 
const emptyProject = {
    title: "",
    content: "",
    meetingMethod: "",
    targetLevel: "",
    capacity: MIN_CAPACITY,
    progressMode: "",
    activeTimes: [],
    deadline: "",
};

// 레벨 카드에 보여줄 점수 범위 
const LEVEL_SCORE_TEXT = {
    STARTER: "0 ~ 2점",
    BUILDER: "2.5 ~ 7점",
    ACHIEVER: "7.5점 이상",
};

// 오늘 날짜 'YYYY-MM-DD'
const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 서버 날짜 값을 date input 형식 'YYYY-MM-DD'로 변환 / 브라우저 기준으로 변환
const toDateInput = (value) => {
    if (!value) {
        return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 서버 활동 시간 값을 배열로 변환
const toTimeArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (!value) {
        return [];
    }
    return value.split(",");
};

// 입력값 검사
const validate = (project, minCapacity = MIN_CAPACITY) => {
    const errors = {};

    // 프로젝트 명: 필수, 100자 이하
    if (project.title.trim() === "") {
        errors.title = "프로젝트 명을 입력해 주세요.";
    } else if (project.title.trim().length > 100) {
        errors.title = "프로젝트 명은 100자 이하로 입력해 주세요.";
    }

    // 모집 인원: 2~5명
    if (project.capacity < MIN_CAPACITY || project.capacity > MAX_CAPACITY) {
        errors.capacity = "모집 인원은 작성자 포함 2~5명으로 선택해 주세요.";
    } else if (project.capacity < minCapacity) {
        errors.capacity = `현재 팀원 수(${minCapacity}명)보다 적게 줄일 수 없습니다.`;
    }

    // 모집 마감일: 필수, 오늘 이후 
    if (project.deadline === "") {
        errors.deadline = "모집 마감일을 선택해 주세요.";
    } else if (project.deadline < getToday()) {
        errors.deadline = "마감일은 오늘 이후로 선택해 주세요.";
    }

    // 학습 수준, 진행 방식: 선택 필수
    if (project.targetLevel === "") {
        errors.targetLevel = "학습 수준을 선택해 주세요.";
    }
    if (project.progressMode === "") {
        errors.progressMode = "진행 방식을 선택해 주세요.";
    }

    // 주요 활동 시간: 1개 이상
    if (project.activeTimes.length === 0) {
        errors.activeTimes = "주요 활동 시간을 1개 이상 선택해 주세요.";
    }

    // 프로젝트 소개: 필수, 2000자 이하
    if (project.content.trim() === "") {
        errors.content = "프로젝트 소개를 입력해 주세요.";
    } else if (project.content.length > 2000) {
        errors.content = "프로젝트 소개는 2000자 이하로 입력해 주세요.";
    }

    // 회의 진행 및 모임 방식: 필수, 2000자 이하
    if (project.meetingMethod.trim() === "") {
        errors.meetingMethod = "회의 진행 및 모임 방식을 입력해 주세요.";
    } else if (project.meetingMethod.length > 2000) {
        errors.meetingMethod = "회의 진행 및 모임 방식은 2000자 이하로 입력해 주세요.";
    }

    return errors;
};

function ProjectForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    // 주소에 id가 있으면 수정 모드
    const isEdit = id !== undefined;
    const modeText = isEdit ? "수정" : "작성";
    const submitText = isEdit ? "수정하기" : "등록하기";
    const submittingText = isEdit ? "수정 중…" : "등록 중…";

    // 상태: 입력값, 항목별 오류, 서버 오류, 등록 중 여부
    const [project, setProject] = useState(emptyProject);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 수정 모드 전용 상태: 불러오기 중, 불러오기 실패, 다시 시도 횟수, 글 정보
    const [isLoading, setIsLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [authorId, setAuthorId] = useState(null);
    const [status, setStatus] = useState("");
    const [minCapacity, setMinCapacity] = useState(MIN_CAPACITY);

    // 수정 모드: 기존 모집 글 불러오기
    useEffect(() => {
        if (!isEdit) {
            return;
        }

        // 응답이 오기 전 다른 화면으로 이동하면 이전 응답은 무시
        let ignore = false;

        const loadProject = async () => {
            try {
                const res = await getProject(id);
                if(ignore){
                    return;
                }
                const data = res.data.data;

                // 입력칸에 기존 값 채우기 (서버 요청 본문과 같은 이름만)
                setProject({
                    title: data.title,
                    content: data.content,
                    meetingMethod: data.meetingMethod,
                    targetLevel: data.targetLevel,
                    capacity: data.capacity,
                    progressMode: data.progressMode,
                    activeTimes: toTimeArray(data.activeTimes),
                    deadline: toDateInput(data.deadline),
                });
                setAuthorId(data.authorId);
                setStatus(data.status);

                // 현재 팀원 수보다 정원을 줄일 수 없음 (NFR-026)
                if (data.memberCount) {
                    setMinCapacity(Math.max(MIN_CAPACITY, data.memberCount));
                }
            } catch (error) {
                if (ignore) {
                    return;
                }
                let message = "모집 글을 불러오지 못했습니다.";
                if (error.response && error.response.data && error.response.data.message) {
                    message = error.response.data.message;
                }
                setLoadError(message);
            } finally {
                if (ignore) {
                    setIsLoading(false);
                }
            }
        };

        loadProject();

        return () => {
            ignore = true;
        };

    }, [isEdit, id, reloadKey]);

    // 불러오기 다시 시도
    const handleReload = () => {
        setLoadError("");
        setIsLoading(true);
        setReloadKey(reloadKey + 1);
    };

    // 일반 입력칸 (input, textarea, 라디오 - 학습 수준·진행 방식)
    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextProject = { ...project, [name]: value };
        setProject(nextProject);

        // 이미 오류가 표시된 항목은 고치는 즉시 다시 검사 (NFR-011)
        if (errors[name]) {
            setErrors({ ...errors, [name]: validate(nextProject, minCapacity)[name] });
        }
    };

    // 모집 인원 - / + 버튼
    const handleCapacity = (step) => {
        const nextCapacity = project.capacity + step;

        if (nextCapacity < minCapacity || nextCapacity > MAX_CAPACITY) {
            return;
        }

        setProject({ ...project, capacity: nextCapacity });
    };

    // 주요 활동 시간 (여러 개 선택)
    const handleTimeChange = (e) => {
        const { value, checked } = e.target;
        let nextTimes;

        if (checked) {
            nextTimes = [...project.activeTimes, value];
        } else {
            nextTimes = project.activeTimes.filter((time) => time !== value);
        }

        const nextProject = { ...project, activeTimes: nextTimes };
        setProject(nextProject);

        // 이미 오류가 표시돼 있으면 고치는 즉시 다시 검사
        if (errors.activeTimes) {
            setErrors({ ...errors, activeTimes: validate(nextProject,minCapacity).activeTimes });
        }
    };

    // 등록
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        // 제출 전 전체 검사
        const nextErrors = validate(project,minCapacity);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setServerError("");
        setIsSubmitting(true);

        const data = {
            ...project,
            title: project.title.trim(),
        };

        try {
            if (isEdit) {
                // 수정: 기존 글 변경 후 그 글 상세로 이동
                await updateProject(id, data);
                navigate(`/projects/${id}`);
            } else {
                // 작성: 새 글 등록 후 새 글 상세로 이동
                const res = await createProject(data);
                navigate(`/projects/${res.data.data.id}`);
            }
        } catch (error) {
            // 실패하면 입력 내용은 그대로 두고 서버 메시지 표시
             let message = isEdit ? "모집 글 수정에 실패했습니다. 다시 시도해 주세요." : "모집 글 등록에 실패했습니다. 다시 시도해 주세요.";
            if (error.response && error.response.data && error.response.data.message) {
                message = error.response.data.message;
            }
            setServerError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

     if (isEdit && isLoading) {
        return (
            <main className="project-form-page">
                <p className="project-form-page__notice">모집 글을 불러오는 중입니다.</p>
            </main>
        );
    }

    if (isEdit && loadError) {
        return (
            <main className="project-form-page">
                <div className="project-form-page__notice" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="project-form__button project-form__button--primary" onClick={handleReload}>
                        다시 시도
                    </button>
                </div>
            </main>
        );
    }

    // 작성자 본인만 / 모집완료 글은 수정 불가
    let blockMessage = "";
    if (isEdit && user && String(user.id) !== String(authorId)) {
        blockMessage = "작성자만 모집 글을 수정할 수 있습니다.";
    } else if (isEdit && status === PROJECT_STATUS.CLOSED) {
        blockMessage = "모집완료된 글은 수정할 수 없습니다.";
    }

    if (blockMessage) {
        return (
            <main className="project-form-page">
                <div className="project-form-page__notice" role="alert">
                    <p>{blockMessage}</p>
                    <Link className="project-form__button project-form__button--primary" to={`/projects/${id}`}>
                        모집 글로 돌아가기
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="project-form-page">
            {/* 상단: 경로 + 제목 + 버튼 */}
            <div className="project-form-page__head">
                <div>
                    <p className="project-form-page__breadcrumb">
                        <Link to="/projects">모집 게시판</Link> › 모집 글 {modeText}
                    </p>
                    <h1 className="project-form-page__title">프로젝트 모집 글 {modeText}</h1>
                </div>

                <div className="project-form-page__actions">
                    <button type="button" className="project-form__button" onClick={() => navigate(-1)}>
                        취소
                    </button>
                    {/* 폼 밖에 있는 버튼이라 form 속성으로 아래 폼과 연결 */}
                    <button
                        type="submit"
                        form="project-form"
                        className="project-form__button project-form__button--primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? submittingText : submitText}
                    </button>
                </div>
            </div>

            <form id="project-form" className="project-form" onSubmit={handleSubmit} noValidate>
                {/* 서버 오류 */}
                {serverError && <p className="project-form__server-error" role="alert">{serverError}</p>}

                {/* ===== 1. 모집 정보 ===== */}
                <section className="project-form__section">
                    <h2 className="project-form__section-title">1. 모집 정보</h2>

                    {/* 프로젝트 명 */}
                    <div className="project-form__field">
                        <label htmlFor="title" className="project-form__label">
                            프로젝트 명 <span className="project-form__required" aria-hidden="true">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            className={errors.title ? "project-form__input project-form__input--error" : "project-form__input"}
                            value={project.title}
                            onChange={handleChange}
                            placeholder="예) 스터디 일정 공유 웹 서비스 - REST API 연습"
                        />
                        {errors.title && <p className="project-form__error">{errors.title}</p>}
                    </div>

                    {/* 모집 인원 + 모집 마감일 (두 칸) */}
                    <div className="project-form__row">
                        <div className="project-form__field">
                            <p id="capacity-label" className="project-form__label">
                                모집 인원 <span className="project-form__required" aria-hidden="true">*</span>
                            </p>
                            <div className="project-form__stepper">
                                <p className="project-form__input project-form__stepper-value" aria-labelledby="capacity-label" aria-live="polite">
                                    {project.capacity}명 (나 포함)
                                </p>
                                <button
                                    type="button"
                                    className="project-form__step-button"
                                    onClick={() => handleCapacity(-1)}
                                    disabled={project.capacity <= minCapacity}
                                    aria-label="모집 인원 줄이기"
                                >
                                    −
                                </button>
                                <button
                                    type="button"
                                    className="project-form__step-button"
                                    onClick={() => handleCapacity(1)}
                                    disabled={project.capacity >= MAX_CAPACITY}
                                    aria-label="모집 인원 늘리기"
                                >
                                    +
                                </button>
                            </div>
                            <p className="project-form__help">인원이 모두 모이면 자동으로 모집완료 처리되며 정원을 추가할 수 없어요</p>
                            {errors.capacity && <p className="project-form__error">{errors.capacity}</p>}
                        </div>

                        <div className="project-form__field">
                            <label htmlFor="deadline" className="project-form__label">
                                모집 마감일 <span className="project-form__required" aria-hidden="true">*</span>
                            </label>
                            <input
                                id="deadline"
                                name="deadline"
                                type="date"
                                className={errors.deadline ? "project-form__input project-form__input--error" : "project-form__input"}
                                value={project.deadline}
                                min={getToday()}
                                onChange={handleChange}
                            />
                            {errors.deadline && <p className="project-form__error">{errors.deadline}</p>}
                        </div>
                    </div>

                    {/* 학습 수준 (카드 중 하나 선택) */}
                    <fieldset className="project-form__field project-form__fieldset">
                        <legend className="project-form__label">
                            학습 수준 (모집 레벨) <span className="project-form__required" aria-hidden="true">*</span>
                        </legend>
                        <div className="project-form__levels">
                            {LEVEL_OPTIONS.map((level) => (
                                <label
                                    key={level.code}
                                    className={project.targetLevel === level.code ? "project-form__level project-form__level--selected" : "project-form__level"}
                                >
                                    <span className="project-form__level-top">
                                        <input
                                            type="radio"
                                            name="targetLevel"
                                            value={level.code}
                                            checked={project.targetLevel === level.code}
                                            onChange={handleChange}
                                        />
                                        <span className={`project-form__level-badge project-form__level-badge--${level.code.toLowerCase()}`}>
                                            {level.label}
                                        </span>
                                    </span>
                                    <span className="project-form__level-score">{LEVEL_SCORE_TEXT[level.code]}</span>
                                </label>
                            ))}
                        </div>
                        <p className="project-form__help">선택한 레벨의 사용자에게 이 모집 글이 추천되고, 레벨 필터로 검색돼요</p>
                        {errors.targetLevel && <p className="project-form__error">{errors.targetLevel}</p>}
                    </fieldset>

                    {/* 진행 방식 + 주요 활동 시간 (두 칸) */}
                    <div className="project-form__row">
                        <fieldset className="project-form__field project-form__fieldset">
                            <legend className="project-form__label">
                                지역 (진행 방식) <span className="project-form__required" aria-hidden="true">*</span>
                            </legend>
                            <div className="project-form__chips">
                                {PROGRESS_MODE_OPTIONS.map((mode) => (
                                    <label
                                        key={mode.code}
                                        className={project.progressMode === mode.code ? "project-form__chip project-form__chip--selected" : "project-form__chip"}
                                    >
                                        <input
                                            type="radio"
                                            name="progressMode"
                                            className="project-form__chip-input"
                                            value={mode.code}
                                            checked={project.progressMode === mode.code}
                                            onChange={handleChange}
                                        />
                                        {mode.label}
                                    </label>
                                ))}
                            </div>
                            {errors.progressMode && <p className="project-form__error">{errors.progressMode}</p>}
                        </fieldset>

                        <fieldset className="project-form__field project-form__fieldset">
                            <legend className="project-form__label">
                                주요 활동 시간 <span className="project-form__required" aria-hidden="true">*</span>
                            </legend>
                            <div className="project-form__chips">
                                {ACTIVE_TIME_OPTIONS.map((time) => (
                                    <label
                                        key={time.code}
                                        className={project.activeTimes.includes(time.code) ? "project-form__chip project-form__chip--selected" : "project-form__chip"}
                                    >
                                        <input
                                            type="checkbox"
                                            className="project-form__chip-input"
                                            value={time.code}
                                            checked={project.activeTimes.includes(time.code)}
                                            onChange={handleTimeChange}
                                        />
                                        {time.label}
                                    </label>
                                ))}
                            </div>
                            {errors.activeTimes && <p className="project-form__error">{errors.activeTimes}</p>}
                        </fieldset>
                    </div>
                </section>

                {/* ===== 2. 프로젝트 설명 ===== */}
                <section className="project-form__section">
                    <h2 className="project-form__section-title">2. 프로젝트 설명</h2>

                    {/* 프로젝트 소개 */}
                    <div className="project-form__field">
                        <label htmlFor="content" className="project-form__label">
                            ① 프로젝트 소개 <span className="project-form__required" aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            className={errors.content ? "project-form__input project-form__input--error" : "project-form__input"}
                            value={project.content}
                            onChange={handleChange}
                            placeholder="어떤 프로젝트인지, 무엇을 목표로 하는지 적어 주세요."
                        />
                        {errors.content && <p className="project-form__error">{errors.content}</p>}
                    </div>

                    {/* 회의 진행 및 모임 방식 */}
                    <div className="project-form__field">
                        <label htmlFor="meetingMethod" className="project-form__label">
                            ② 회의 진행 및 모임 방식 <span className="project-form__required" aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="meetingMethod"
                            name="meetingMethod"
                            className={errors.meetingMethod ? "project-form__input project-form__input--error" : "project-form__input"}
                            value={project.meetingMethod}
                            onChange={handleChange}
                            placeholder="예) 매주 화·목 저녁 9시 디스코드 회의 (30분)"
                        />
                        {errors.meetingMethod && <p className="project-form__error">{errors.meetingMethod}</p>}
                    </div>
                </section>
            </form>
        </main>
    );
}

function ProjectFormPage() {
    const { id } = useParams();
    return <ProjectForm key = {id || "new"} />;
}

export default ProjectFormPage;