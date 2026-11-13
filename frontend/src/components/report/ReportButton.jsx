import "./ReportButton.css";

// reported: 이미 신고한 대상이면 "신고됨"으로 표시하고 누를 수 없음
export default function ReportButton({
  onClick,
  disabled = false,
  reported = false,
}) {
  return (
    <button
      type="button"
      className="report-button"
      onClick={onClick}
      disabled={disabled || reported}
    >
      {reported ? "신고됨" : "신고"}
    </button>
  );
}
