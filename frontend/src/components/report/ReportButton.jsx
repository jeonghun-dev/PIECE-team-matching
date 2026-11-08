import "./ReportButton.css";

export default function ReportButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="report-button"
      onClick={onClick}
      disabled={disabled}
    >
      신고
    </button>
  );
}
