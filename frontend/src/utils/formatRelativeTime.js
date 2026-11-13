// API의 작성 시각을 상대 시간과 한국 시간으로 표시한다.
export function formatRelativeTime(value, now = Date.now()) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const minutes = Math.floor(Math.max(0, now - date.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const label = days >= 1
    ? `${days}일 전`
    : hours >= 1
      ? `${hours}시간 전`
      : minutes >= 1
        ? `${minutes}분 전`
        : "방금 전";

  return {
    label,
    dateTime: date.toISOString(),
    exact: new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date)
  };
}
