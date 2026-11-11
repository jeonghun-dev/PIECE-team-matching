// 화면 표시용 공통 변환 함수

// 쉼표 문자열 → 배열 ("A,B" → ["A", "B"])
// SET 컬럼, GROUP_CONCAT 결과처럼 쉼표로 이어진 값을 나눌 때
function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// 코드 → 표시 이름 ("ONLINE" → "온라인")
// 공통 상수의 { code, label } 목록에서 찾고, 없으면 코드를 그대로 보여주기
function findLabel(options, code) {
  const option = options.find((item) => item.code === code);

  if (option) {
    return option.label;
  }

  return code;
}

// 날짜 → "2026.11.11" (한국 시간 기준)
function formatDate(value, fallback = "-") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  const day = parts.find((part) => part.type === "day").value;

  return `${year}.${month}.${day}`;
}

// 마감일 → "11.30" (카드처럼 좁은 곳에 쓰는 짧은 형식)
function formatDeadline(value, fallback = "마감일 미정") {
  if (!value) {
    return fallback;
  }

  // "2026-11-30"처럼 날짜만 오면 시간대 변환 없이 바로 자르기
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(5).replace("-", ".");
  }

  const fullDate = formatDate(value, "");

  if (!fullDate) {
    return fallback;
  }

  return fullDate.slice(5);
}

// 남은 날 → "D-3" / "D-Day" / "마감" (dDay는 서버가 계산한 값)
function formatDDay(dDay, emptyText = "-") {
  if (dDay == null) {
    return emptyText;
  }

  const days = Number(dDay);

  if (days > 0) {
    return `D-${days}`;
  }

  if (days === 0) {
    return "D-Day";
  }

  return "마감";
}

export { toArray, findLabel, formatDate, formatDeadline, formatDDay };